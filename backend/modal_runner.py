import httpx
import os


def trigger_reconstruction(model_id: str, user_id: str, input_type: str):
    """Chama o web endpoint do Modal para iniciar o processamento 3D."""
    endpoint_url = os.environ.get("MODAL_ENDPOINT_URL", "")
    if not endpoint_url:
        raise ValueError("MODAL_ENDPOINT_URL não está configurado.")

    with httpx.Client() as client:
        client.post(endpoint_url, json={
            "model_id": model_id,
            "user_id": user_id,
            "input_type": input_type,
        }, timeout=30)
