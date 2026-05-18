"""
Pipeline TripoSR — IA para gerar modelo 3D a partir de 1 foto (30 segundos)
"""
import modal
import os
import tempfile
from pathlib import Path

# Volume para cache dos pesos do modelo (~2GB) — evita download a cada execução
model_cache = modal.Volume.from_name("triposr-model-cache", create_if_missing=True)

image = (
    modal.Image.debian_slim(python_version="3.11")
    .env({"DEBIAN_FRONTEND": "noninteractive", "HF_HOME": "/model-cache"})
    .apt_install("libgl1", "libglib2.0-0", "git", "libgomp1")
    .pip_install(
        "torch==2.1.2",
        "torchvision==0.16.2",
        "transformers>=4.35.0",
        "accelerate>=0.24.0",
        "huggingface_hub>=0.20.0",
        "einops",
        "omegaconf",
        "trimesh[easy]==4.1.3",
        "pillow==10.2.0",
        "numpy==1.26.3",
        "supabase>=2.7.0,<3.0.0",
        "rembg==2.0.50",
        "onnxruntime",
    )
    .run_commands(
        "git clone https://github.com/VAST-AI-Research/TripoSR.git /triposr",
    )
)

app = modal.App("scan3d-triposr", image=image)

SECRETS = [
    modal.Secret.from_name("supabase-url"),
    modal.Secret.from_name("supabase-service-key"),
]


@app.function(secrets=SECRETS)
@modal.fastapi_endpoint(method="POST")
def reconstruct_ai_endpoint(body: dict):
    """Web endpoint — recebe pedido e dispara TripoSR assíncrono."""
    reconstruct_ai.spawn(
        model_id=body["model_id"],
        user_id=body["user_id"],
    )
    return {"status": "started", "model_id": body["model_id"]}


@app.function(
    gpu="T4",
    timeout=300,
    secrets=SECRETS,
    volumes={"/model-cache": model_cache},
)
def reconstruct_ai(model_id: str, user_id: str):
    """Gera modelo 3D a partir de 1 foto usando TripoSR."""
    from supabase import create_client
    from PIL import Image
    import torch

    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

    def update_status(status: str, error_msg: str = None):
        data = {"status": status}
        if error_msg:
            data["error_msg"] = error_msg[:500]
        sb.table("models").update(data).eq("id", model_id).execute()

    with tempfile.TemporaryDirectory() as workdir:
        workdir = Path(workdir)

        try:
            update_status("processing")

            # 1. Descarregar imagem do Supabase Storage
            files = sb.storage.from_("uploads").list(f"{user_id}/{model_id}")
            image_file = None
            for f in files:
                if f["name"].lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                    image_file = f
                    break

            if not image_file:
                raise ValueError("Nenhuma imagem encontrada. Certifica-te de fazer upload de uma foto.")

            path = f"{user_id}/{model_id}/{image_file['name']}"
            data = sb.storage.from_("uploads").download(path)
            img_path = workdir / image_file["name"]
            img_path.write_bytes(data)

            # 2. Remover fundo (melhora muito o resultado do TripoSR)
            from rembg import remove
            img_original = Image.open(img_path).convert("RGBA")
            img_no_bg = remove(img_original)
            # Fundo cinzento neutro (TripoSR prefere fundo uniforme)
            img_clean = Image.new("RGBA", img_no_bg.size, (127, 127, 127, 255))
            img_clean.paste(img_no_bg, mask=img_no_bg.split()[3])
            img_clean = img_clean.convert("RGB")

            # Redimensionar para 512x512 (tamanho de input do TripoSR)
            img_clean = img_clean.resize((512, 512), Image.LANCZOS)

            # 3. Carregar e correr TripoSR
            import sys
            sys.path.insert(0, "/triposr")
            from tsr.system import TSR

            model = TSR.from_pretrained(
                "stabilityai/TripoSR",
                config_name="config.yaml",
                weight_name="model.ckpt",
            )
            model.renderer.set_chunk_size(131072)
            model.to("cuda")

            with torch.no_grad():
                scene_codes = model([img_clean], device="cuda")

            # 4. Extrair malha 3D
            meshes = model.extract_mesh(scene_codes, has_vertex_color=False)
            mesh = meshes[0]

            glb_path = workdir / "model.glb"
            mesh.export(str(glb_path))

            if not glb_path.exists() or glb_path.stat().st_size < 1000:
                raise ValueError("Ficheiro GLB gerado está vazio ou corrompido.")

            # 5. Upload para Supabase Storage
            glb_storage = f"{user_id}/{model_id}/model.glb"
            sb.storage.from_("models").upload(
                glb_storage, glb_path.read_bytes(),
                {"content-type": "model/gltf-binary", "upsert": "true"}
            )

            sb.table("models").update({
                "status": "done",
                "model_url": sb.storage.from_("models").get_public_url(glb_storage),
            }).eq("id", model_id).execute()

        except Exception as e:
            update_status("error", str(e))
            raise
