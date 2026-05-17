"""
Pipeline de reconstrução 3D no Modal.com
Fluxo: fotos/vídeo → COLMAP (SfM + MVS) → Open3D (malha) → .glb
"""
import modal
import os
import subprocess
import tempfile
import shutil
from pathlib import Path

image = (
    modal.Image.debian_slim(python_version="3.11")
    .env({"DEBIAN_FRONTEND": "noninteractive", "TZ": "Europe/Lisbon"})
    .apt_install("ffmpeg", "colmap", "libgl1", "libglib2.0-0")
    .pip_install(
        "fastapi[standard]",
        "supabase>=2.7.0,<3.0.0",
        "open3d==0.18.0",
        "trimesh==4.1.3",
        "ffmpeg-python==0.2.0",
        "numpy==1.26.3",
        "pillow==10.2.0",
    )
)

app = modal.App("scan3d-processing", image=image)

SECRETS = [
    modal.Secret.from_name("supabase-url"),
    modal.Secret.from_name("supabase-service-key"),
]


@app.function(secrets=SECRETS)
@modal.fastapi_endpoint(method="POST")
def reconstruct_endpoint(body: dict):
    """Web endpoint HTTP — recebe pedido e dispara processamento assíncrono."""
    reconstruct.spawn(
        model_id=body["model_id"],
        user_id=body["user_id"],
        input_type=body["input_type"],
    )
    return {"status": "started", "model_id": body["model_id"]}


@app.function(gpu="T4", timeout=1800, secrets=SECRETS)
def reconstruct(model_id: str, user_id: str, input_type: str):
    """Função principal de reconstrução 3D — corre na GPU."""
    from supabase import create_client
    import ffmpeg
    import open3d as o3d
    import trimesh

    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

    def update_status(status: str, error_msg: str = None):
        data = {"status": status}
        if error_msg:
            data["error_msg"] = error_msg[:500]
        sb.table("models").update(data).eq("id", model_id).execute()

    with tempfile.TemporaryDirectory() as workdir:
        workdir = Path(workdir)
        frames_dir = workdir / "frames"
        frames_dir.mkdir()
        colmap_dir = workdir / "colmap"
        colmap_dir.mkdir()
        output_dir = workdir / "output"
        output_dir.mkdir()

        try:
            # 1. Descarregar ficheiros
            files = sb.storage.from_("uploads").list(f"{user_id}/{model_id}")
            for f in files:
                path = f"{user_id}/{model_id}/{f['name']}"
                data = sb.storage.from_("uploads").download(path)
                (workdir / f["name"]).write_bytes(data)

            # 2. Extrair frames do vídeo ou copiar fotos
            if input_type == "video":
                update_status("extracting")
                video_files = (
                    list(workdir.glob("*.mp4")) + list(workdir.glob("*.mov")) +
                    list(workdir.glob("*.avi")) + list(workdir.glob("*.webm"))
                )
                if not video_files:
                    raise ValueError("Nenhum ficheiro de vídeo encontrado.")
                (
                    ffmpeg.input(str(video_files[0]))
                    .filter("fps", fps=2)
                    .output(str(frames_dir / "frame_%04d.jpg"), qscale=2)
                    .run(quiet=True)
                )
            else:
                for ext in ["*.jpg", "*.jpeg", "*.png", "*.webp"]:
                    for img in workdir.glob(ext):
                        shutil.copy(img, frames_dir)

            frame_count = len(list(frames_dir.glob("*")))
            if frame_count < 10:
                raise ValueError(f"Imagens insuficientes ({frame_count}).")

            sb.table("models").update({
                "frames_count": frame_count, "status": "processing"
            }).eq("id", model_id).execute()

            # 3. COLMAP — Feature extraction + matching
            db_path = str(colmap_dir / "database.db")
            subprocess.run([
                "colmap", "feature_extractor",
                "--database_path", db_path,
                "--image_path", str(frames_dir),
                "--ImageReader.single_camera", "1",
                "--SiftExtraction.use_gpu", "1",
            ], check=True, capture_output=True)

            subprocess.run([
                "colmap", "exhaustive_matcher",
                "--database_path", db_path,
                "--SiftMatching.use_gpu", "1",
            ], check=True, capture_output=True)

            # 4. COLMAP — Structure from Motion
            sparse_dir = colmap_dir / "sparse"
            sparse_dir.mkdir()
            subprocess.run([
                "colmap", "mapper",
                "--database_path", db_path,
                "--image_path", str(frames_dir),
                "--output_path", str(sparse_dir),
            ], check=True, capture_output=True)

            # 5. COLMAP — Dense reconstruction
            dense_dir = colmap_dir / "dense"
            dense_dir.mkdir()
            subprocess.run([
                "colmap", "image_undistorter",
                "--image_path", str(frames_dir),
                "--input_path", str(sparse_dir / "0"),
                "--output_path", str(dense_dir),
            ], check=True, capture_output=True)

            subprocess.run([
                "colmap", "patch_match_stereo",
                "--workspace_path", str(dense_dir),
                "--PatchMatchStereo.gpu_index", "0",
            ], check=True, capture_output=True)

            subprocess.run([
                "colmap", "stereo_fusion",
                "--workspace_path", str(dense_dir),
                "--output_path", str(output_dir / "fused.ply"),
            ], check=True, capture_output=True)

            # 6. Open3D — Nuvem de pontos → malha 3D
            pcd = o3d.io.read_point_cloud(str(output_dir / "fused.ply"))
            pcd.estimate_normals()
            pcd.orient_normals_consistent_tangent_plane(30)
            mesh, _ = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(pcd, depth=9)
            mesh = mesh.simplify_quadric_decimation(100_000)
            mesh.remove_degenerate_triangles()
            mesh.remove_unreferenced_vertices()

            obj_path = output_dir / "model.obj"
            glb_path = output_dir / "model.glb"
            o3d.io.write_triangle_mesh(str(obj_path), mesh)
            trimesh.load(str(obj_path)).export(str(glb_path))

            # 7. Upload para Supabase Storage
            glb_storage = f"{user_id}/{model_id}/model.glb"
            obj_storage = f"{user_id}/{model_id}/model.obj"

            sb.storage.from_("models").upload(
                glb_storage, glb_path.read_bytes(),
                {"content-type": "model/gltf-binary", "upsert": "true"}
            )
            sb.storage.from_("models").upload(
                obj_storage, obj_path.read_bytes(),
                {"content-type": "model/obj", "upsert": "true"}
            )

            sb.table("models").update({
                "status": "done",
                "model_url": sb.storage.from_("models").get_public_url(glb_storage),
                "obj_url": sb.storage.from_("models").get_public_url(obj_storage),
            }).eq("id", model_id).execute()

        except subprocess.CalledProcessError as e:
            update_status("error", f"COLMAP: {e.stderr.decode()[-300:] if e.stderr else str(e)}")
            raise
        except Exception as e:
            update_status("error", str(e))
            raise
