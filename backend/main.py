from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

from supabase_utils import get_supabase
from plans import check_plan_limit, increment_model_count, get_plan
from modal_runner import trigger_reconstruction
from stripe_webhook import handle_stripe_webhook
from stripe_checkout import create_checkout_session, create_portal_session

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Scan3D API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)


class ReconstructRequest(BaseModel):
    model_id: str
    user_id: str
    input_type: str  # 'photos' | 'video'


class CheckoutRequest(BaseModel):
    user_id: str
    plan: str  # 'creator' | 'pro'


class PortalRequest(BaseModel):
    user_id: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/reconstruct")
async def reconstruct(req: ReconstructRequest):
    """Inicia o processamento 3D de um modelo."""
    try:
        sb = get_supabase()

        # Verificar limite do plano
        allowed, reason = await check_plan_limit(req.user_id)
        if not allowed:
            raise HTTPException(status_code=402, detail=reason)

        # Marca de água: só o plano grátis tem marca de água Snap3D
        plan = await get_plan(req.user_id)
        watermark = plan == "free"

        # Data de expiração conforme o plano (Pro = nunca expira)
        expiry_days = {"free": 30, "creator": 90}.get(plan)
        expires_at = (
            (datetime.now(timezone.utc) + timedelta(days=expiry_days)).isoformat()
            if expiry_days else None
        )

        # Atualizar estado para 'extracting' (vídeo) ou 'processing' (fotos)
        initial_status = "extracting" if req.input_type == "video" else "processing"
        sb.table("models").update({
            "status": initial_status,
            "watermark": watermark,
            "expires_at": expires_at,
        }).eq("id", req.model_id).execute()

        # Incrementar contador de modelos do utilizador
        await increment_model_count(req.user_id)

        # Disparar job assíncrono no Modal.com
        trigger_reconstruction(req.model_id, req.user_id, req.input_type)

        return {"message": "Processamento iniciado", "model_id": req.model_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro em /reconstruct: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/status/{model_id}")
async def get_status(model_id: str):
    """Devolve o estado atual de um modelo."""
    try:
        sb = get_supabase()
        result = sb.table("models").select(
            "id, status, model_url, obj_url, splat_url, stl_url, watermark"
        ).eq("id", model_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Modelo não encontrado")
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro em /status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/create-checkout-session")
async def checkout(req: CheckoutRequest):
    """Cria uma sessão de checkout do Stripe para subscrever um plano."""
    try:
        url = create_checkout_session(req.user_id, req.plan)
        return {"url": url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro em /create-checkout-session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/create-portal-session")
async def portal(req: PortalRequest):
    """Cria uma sessão do portal de cliente Stripe (gerir/cancelar)."""
    try:
        url = create_portal_session(req.user_id)
        return {"url": url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro em /create-portal-session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Recebe eventos do Stripe (pagamentos, cancelamentos)."""
    body = await request.body()
    await handle_stripe_webhook(body, stripe_signature)
    return {"received": True}
