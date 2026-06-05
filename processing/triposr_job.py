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
    .apt_install("libgl1", "libglib2.0-0", "git", "libgomp1", "build-essential")
    # 1. Torch primeiro (torchmcubes precisa dele instalado para compilar)
    .pip_install(
        "torch==2.1.2",
        "torchvision==0.16.2",
    )
    # 2. Restantes dependências
    .pip_install(
        "fastapi[standard]",
        "transformers==4.35.0",
        "accelerate>=0.24.0",
        "huggingface_hub>=0.20.0",
        "einops==0.7.0",
        "omegaconf==2.3.0",
        "trimesh==4.1.3",
        "pillow==10.2.0",
        "numpy==1.26.3",
        "supabase>=2.7.0,<3.0.0",
        "rembg==2.0.50",
        "onnxruntime",
        "imageio[ffmpeg]",
    )
    # 3. torchmcubes (marching cubes) — compila com o torch já instalado
    .run_commands(
        "pip install --no-build-isolation git+https://github.com/tatsy/torchmcubes.git",
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
    import sys
    sys.path.insert(0, "/triposr")

    from supabase import create_client
    from PIL import Image
    import numpy as np
    import torch
    import rembg

    from tsr.system import TSR
    from tsr.utils import remove_background, resize_foreground

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

            # 2. Pré-processamento oficial TripoSR — remove fundo + recorta objeto
            rembg_session = rembg.new_session()
            image = Image.open(img_path)
            image = remove_background(image, rembg_session)
            image = resize_foreground(image, 0.85)
            image = np.array(image).astype(np.float32) / 255.0
            # Compor sobre fundo cinzento neutro (0.5) usando canal alfa
            image = image[:, :, :3] * image[:, :, 3:4] + (1 - image[:, :, 3:4]) * 0.5
            image = Image.fromarray((image * 255.0).astype(np.uint8))

            # 3. Carregar modelo TripoSR (pesos em cache no volume)
            model = TSR.from_pretrained(
                "stabilityai/TripoSR",
                config_name="config.yaml",
                weight_name="model.ckpt",
            )
            model.renderer.set_chunk_size(8192)
            model.to("cuda")

            # 4. Inferência → códigos da cena
            with torch.no_grad():
                scene_codes = model([image], device="cuda")

            # 5. Extrair malha 3D com cor nos vértices (resolução 256)
            meshes = model.extract_mesh(scene_codes, True, resolution=256)
            mesh = meshes[0]

            glb_path = workdir / "model.glb"
            mesh.export(str(glb_path))

            if not glb_path.exists() or glb_path.stat().st_size < 1000:
                raise ValueError("Ficheiro GLB gerado está vazio ou corrompido.")

            # 6. Upload para Supabase Storage
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
