import modal

# Referência à função de processamento definida em processing/colmap_job.py
reconstruct_fn = modal.Function.lookup("scan3d-processing", "reconstruct")


def trigger_reconstruction(model_id: str, user_id: str, input_type: str):
    """Dispara o job de reconstrução 3D no Modal.com de forma assíncrona."""
    reconstruct_fn.spawn(
        model_id=model_id,
        user_id=user_id,
        input_type=input_type,
    )
