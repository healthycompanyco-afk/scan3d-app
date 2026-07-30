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

            # 1. Descarregar TODAS as imagens do Supabase Storage
            files = sb.storage.from_("uploads").list(f"{user_id}/{model_id}")
            image_names = sorted(
                f["name"] for f in files
                if f["name"].lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
            )
            if not image_names:
                raise ValueError("Nenhuma imagem encontrada. Faz upload de pelo menos uma foto.")

            # Limitar a 6 imagens (retorno reduzido acima disso, e poupa memória)
            image_names = image_names[:6]
            images = []
            for name in image_names:
                data = sb.storage.from_("uploads").download(f"{user_id}/{model_id}/{name}")
                img_path = workdir / name
                img_path.write_bytes(data)
                images.append(Image.open(img_path))

            # 2. Carregar pipeline TRELLIS (image-to-3D)
            from trellis.pipelines import TrellisImageTo3DPipeline
            from trellis.utils import postprocessing_utils

            pipeline = TrellisImageTo3DPipeline.from_pretrained("microsoft/TRELLIS-image-large")
            pipeline.cuda()

            # 3. Inferência — 1 foto usa run(), várias fotos usam run_multi_image()
            #    (o pipeline remove o fundo automaticamente)
            # Boost de qualidade: mais passos de amostragem que os 12 por defeito.
            quality_params = {
                "sparse_structure_sampler_params": {"steps": 20, "cfg_strength": 7.5},
                "slat_sampler_params": {"steps": 20, "cfg_strength": 3.0},
            }
            if len(images) == 1:
                outputs = pipeline.run(
                    images[0],
                    seed=1,
                    formats=["gaussian", "mesh"],
                    **quality_params,
                )
            else:
                outputs = pipeline.run_multi_image(
                    images,
                    seed=1,
                    formats=["gaussian", "mesh"],
                    mode="stochastic",  # combina as várias vistas
                    **quality_params,
                )

            # 4. Exportar GLB com textura (textura mais nítida: 2048px)
            glb = postprocessing_utils.to_glb(
                outputs["gaussian"][0],
                outputs["mesh"][0],
                simplify=0.95,        # reduzir polígonos (mais leve para o browser)
                texture_size=2048,    # resolução da textura (era 1024)
            )
            glb_path = workdir / "model.glb"
            glb.export(str(glb_path))

            if not glb_path.exists() or glb_path.stat().st_size < 1000:
                raise ValueError("Ficheiro GLB gerado está vazio ou corrompido.")

            # 4b. Exportar Gaussian Splat (.ply) — preserva cores reais e brilho
            splat_path = workdir / "model.ply"
            outputs["gaussian"][0].save_ply(str(splat_path))

            # 4c. Exportar STL — geometria pronta para impressão 3D (sem textura)
            stl_path = workdir / "model.stl"
            try:
                glb.export(str(stl_path), file_type="stl")
            except Exception:
                stl_path = None  # se falhar, segue sem STL

            # 4d. Thumbnail — renderiza uma imagem do modelo (vista frontal)
            thumb_path = workdir / "thumb.png"
            try:
                from trellis.utils import render_utils
                from PIL import Image as PILImage
                frames = render_utils.render_video(
                    outputs["gaussian"][0], resolution=512, num_frames=8
                )["color"]
                PILImage.fromarray(frames[0]).save(str(thumb_path))
            except Exception:
                thumb_path = None  # se falhar, segue sem thumbnail

            # 5. Upload para Supabase Storage (GLB + splat)
            glb_storage = f"{user_id}/{model_id}/model.glb"
            sb.storage.from_("models").upload(
                glb_storage, glb_path.read_bytes(),
                {"content-type": "model/gltf-binary", "upsert": "true"}
            )

            update_data = {
                "status": "done",
                "model_url": sb.storage.from_("models").get_public_url(glb_storage),
            }

            if splat_path.exists() and splat_path.stat().st_size > 1000:
                splat_storage = f"{user_id}/{model_id}/model.ply"
                sb.storage.from_("models").upload(
                    splat_storage, splat_path.read_bytes(),
                    {"content-type": "application/octet-stream", "upsert": "true"}
                )
                update_data["splat_url"] = sb.storage.from_("models").get_public_url(splat_storage)

            if stl_path and stl_path.exists() and stl_path.stat().st_size > 1000:
                stl_storage = f"{user_id}/{model_id}/model.stl"
                sb.storage.from_("models").upload(
                    stl_storage, stl_path.read_bytes(),
                    {"content-type": "model/stl", "upsert": "true"}
                )
                update_data["stl_url"] = sb.storage.from_("models").get_public_url(stl_storage)

            # Cópia pública da 1ª foto de entrada — permite mostrar o par
            # "foto → modelo" na galeria (o bucket `uploads` é privado).
            try:
                src_name = image_names[0]
                ext = src_name.rsplit(".", 1)[-1].lower()
                mime = "image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}"
                src_storage = f"{user_id}/{model_id}/source.{ext}"
                sb.storage.from_("models").upload(
                    src_storage, (workdir / src_name).read_bytes(),
                    {"content-type": mime, "upsert": "true"}
                )
                update_data["source_url"] = sb.storage.from_("models").get_public_url(src_storage)
            except Exception:
                pass

            if thumb_path and thumb_path.exists() and thumb_path.stat().st_size > 500:
                thumb_storage = f"{user_id}/{model_id}/thumb.png"
                sb.storage.from_("models").upload(
                    thumb_storage, thumb_path.read_bytes(),
                    {"content-type": "image/png", "upsert": "true"}
                )
                update_data["thumbnail_url"] = sb.storage.from_("models").get_public_url(thumb_storage)

            sb.table("models").update(update_data).eq("id", model_id).execute()

            # Avisar o backend para enviar email "modelo pronto" (não crítico)
            try:
                import httpx
                backend_url = os.environ.get("BACKEND_URL", "https://scan3d-backend-fneq.onrender.com")
                httpx.post(f"{backend_url}/notify-model-ready", json={"model_id": model_id}, timeout=20)
            except Exception:
                pass

        except Exception as e:
            update_status("error", str(e))
            raise
