import httpx
import os
import logging

logger = logging.getLogger(__name__)


def trigger_reconstruction(model_id: str, user_id: str, input_type: str):
    """Chama o web endpoint do Modal — TripoSR (IA) ou COLMAP conforme o tipo."""

    if input_type == "ai_single":
        endpoint_url = os.environ.get("MODAL_TRIPOSR_URL", "")
        if not endpoint_url:
            raise ValueError("MODAL_TRIPOSR_URL não está configurado.")
        payload = {"model_id": model_id, "user_id": user_id}
    else:
        endpoint_url = os.environ.get("MODAL_ENDPOINT_URL", "")
        if not endpoint_url:
            raise ValueError("MODAL_ENDPOINT_URL não está configurado.")
        payload = {"model_id": model_id, "user_id": user_id, "input_type": input_type}

    logger.info(f"A disparar Modal [{input_type}] para model_id={model_id}, url={endpoint_url}")

    with httpx.Client() as client:
        response = client.post(endpoint_url, json=payload, timeout=30)

    logger.info(f"Modal respondeu: status={response.status_code}, body={response.text[:200]}")

    if response.status_code not in (200, 202):
        raise ValueError(f"Modal endpoint erro {response.status_code}: {response.text[:300]}")
