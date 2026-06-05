"""
Pipeline TRELLIS (Microsoft) — IA de topo para gerar modelo 3D a partir de 1 foto.
Qualidade muito superior ao TripoSR, com texturas reais.
Repo: https://github.com/microsoft/TRELLIS
"""
import modal
import os
import tempfile
from pathlib import Path

# Volume para cache dos pesos do modelo (vários GB) — evita download a cada execução
model_cache = modal.Volume.from_name("trellis-model-cache", create_if_missing=True)

# Backend de atenção: xformers é muito mais fácil de instalar que flash-attn
# e funciona em T4 (sm_75). SPCONV_ALGO=native evita problemas de runtime.
TRELLIS_ENV = {
    "DEBIAN_FRONTEND": "noninteractive",
    "HF_HOME": "/model-cache",
    "CUDA_HOME": "/usr/local/cuda",
    "TORCH_CUDA_ARCH_LIST": "7.5",          # T4 = 7.5 (A10G seria 8.6)
    "CC": "gcc",
    "CXX": "g++",
    "ATTN_BACKEND": "xformers",
    "SPCONV_ALGO": "native",
}

image = (
    modal.Image.from_registry(
        "nvidia/cuda:12.1.1-devel-ubuntu22.04", add_python="3.11"
    )
    .env(TRELLIS_ENV)
    .apt_install(
        "git", "build-essential", "ninja-build",
        "libgl1", "libglib2.0-0", "libgomp1",
    )
    # 1. PyTorch 2.4 (versão recomendada pelo TRELLIS) + xformers compatível
    .pip_install(
        "torch==2.4.0",
        "torchvision==0.19.0",
        index_url="https://download.pytorch.org/whl/cu121",
    )
    .pip_install("xformers==0.0.27.post2", index_url="https://download.pytorch.org/whl/cu121")
    # 2. Dependências base do TRELLIS
    .pip_install(
        "fastapi[standard]",
        "pillow==10.4.0",
        "imageio",
        "imageio-ffmpeg",
        "tqdm",
        "easydict",
        "opencv-python-headless",
        "scipy",
        "rembg",
        "onnxruntime",
        "trimesh",
        "xatlas",
        "pyvista",
        "pymeshfix",
        "igraph",
        "open3d==0.19.0",   # 0.19 funciona com numpy 1.x e 2.x
        "transformers==4.44.2",
        "supabase>=2.7.0,<3.0.0",
    )
    # 3. Ferramentas de build para as extensões CUDA
    .pip_install("ninja", "scikit-build-core", "pybind11", "cmake==3.31.6", "wheel", "setuptools")
    # 4. spconv (convoluções esparsas) — wheel pré-compilada para CUDA 12.0+
    .pip_install("spconv-cu120")
    # 4b. kaolin (biblioteca 3D da NVIDIA) — wheel pré-compilado para torch 2.4 / cu121
    .pip_install(
        "kaolin==0.17.0",
        find_links="https://nvidia-kaolin.s3.us-east-2.amazonaws.com/torch-2.4.0_cu121.html",
    )
    # 5. Extensões CUDA compiladas a partir do git
    .pip_install("utils3d @ git+https://github.com/EasternJournalist/utils3d.git@9a4eb15e4021b67b12c460c7057d642626897ec8")
    # 5b. Forçar numpy 1.x FINAL — o kaolin exige numpy<2 e o utils3d subiu-o para 2.x
    .pip_install("numpy==1.26.4")
    .run_commands(
        # nvdiffrast (rasterização diferenciável)
        "pip install --no-build-isolation git+https://github.com/NVlabs/nvdiffrast.git",
        # diffoctreerast (octree rasterizer do TRELLIS)
        "pip install --no-build-isolation git+https://github.com/JeffreyXiang/diffoctreerast.git",
        # Rasterizador de Gaussianas (variante mip do TRELLIS)
        "git clone --recurse-submodules https://github.com/autonomousvision/mip-splatting.git /tmp/mip-splatting",
        "pip install --no-build-isolation /tmp/mip-splatting/submodules/diff-gaussian-rasterization/",
        # Código do TRELLIS
        "git clone --recurse-submodules https://github.com/microsoft/TRELLIS.git /trellis",
        gpu="T4",  # compilar com GPU disponível para extensões que verificam CUDA runtime
    )
)

app = modal.App("scan3d-trellis", image=image)

SECRETS = [
    modal.Secret.from_name("supabase-url"),
    modal.Secret.from_name("supabase-service-key"),
]


@app.function(secrets=SECRETS)
@modal.fastapi_endpoint(method="POST")
def reconstruct_trellis_endpoint(body: dict):
    """Web endpoint — recebe pedido e dispara TRELLIS assíncrono."""
    reconstruct_trellis.spawn(
        model_id=body["model_id"],
        user_id=body["user_id"],
    )
    return {"status": "started", "model_id": body["model_id"]}


@app.function(
    gpu="T4",
    timeout=600,
    secrets=SECRETS,
    volumes={"/model-cache": model_cache},
)
def reconstruct_trellis(model_id: str, user_id: str):
    """Gera modelo 3D de alta qualidade a partir de 1 foto usando TRELLIS."""
    import sys
    os.environ["ATTN_BACKEND"] = "xformers"
    os.environ["SPCONV_ALGO"] = "native"
    sys.path.insert(0, "/trellis")

    from supabase import create_client
    from PIL import Image

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
                raise ValueError("Nenhuma imagem encontrada. Faz upload de uma foto.")

            path = f"{user_id}/{model_id}/{image_file['name']}"
            data = sb.storage.from_("uploads").download(path)
            img_path = workdir / image_file["name"]
            img_path.write_bytes(data)

            # 2. Carregar pipeline TRELLIS (image-to-3D)
            from trellis.pipelines import TrellisImageTo3DPipeline
            from trellis.utils import postprocessing_utils

            pipeline = TrellisImageTo3DPipeline.from_pretrained("microsoft/TRELLIS-image-large")
            pipeline.cuda()

            # 3. Correr inferência (o pipeline remove o fundo automaticamente)
            image = Image.open(img_path)
            outputs = pipeline.run(
                image,
                seed=1,
                formats=["gaussian", "mesh"],
            )

            # 4. Exportar GLB com textura
            glb = postprocessing_utils.to_glb(
                outputs["gaussian"][0],
                outputs["mesh"][0],
                simplify=0.95,        # reduzir polígonos (mais leve para o browser)
                texture_size=1024,    # resolução da textura
            )
            glb_path = workdir / "model.glb"
            glb.export(str(glb_path))

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
