from fastapi import FastAPI, HTTPException, Request, Header, Depends
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
from emails import send_welcome_email, send_model_ready_email
from auth import get_user_id

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Monitorização de erros. Sem SENTRY_DSN definido não faz nada, por isso é
# seguro em desenvolvimento e não obriga a conta para a app funcionar.
SENTRY_DSN = os.environ.get("SENTRY_DSN", "")
if SENTRY_DSN:
    import sentry_sdk
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=os.environ.get("ENVIRONMENT", "production"),
        traces_sample_rate=0.0,   # só erros; sem custos de performance
        send_default_pii=False,   # não enviar dados pessoais dos utilizadores
    )
    logger.info("Sentry ativo.")
else:
    logger.info("Sentry inativo (SENTRY_DSN não definido).")

app = FastAPI(title="Snap3D API")

# CORS restrito ao frontend (produção + dev local).
# Aceita apex e www: qual deles é canónico depende da configuração do Vercel,
# e um redirecionamento inesperado bloquearia todos os pedidos à API.
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://snap3d.app")
_alt_origin = (
    FRONTEND_URL.replace("://www.", "://")
    if "://www." in FRONTEND_URL
    else FRONTEND_URL.replace("://", "://www.")
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, _alt_origin, "http://localhost:3000"],
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


class WelcomeRequest(BaseModel):
    user_id: str


class NotifyReadyRequest(BaseModel):
    model_id: str


def _user_email(sb, user_id: str):
    try:
        res = sb.auth.admin.get_user_by_id(user_id)
        return res.user.email if res and res.user else None
    except Exception:
        return None


@app.get("/health")
def health():
    """Estado do serviço + versões que importam para diagnóstico.
    O SDK da Stripe já partiu os pagamentos ao mudar de versão sozinho,
    por isso convém poder consultá-la sem entrar nos logs."""
    import stripe as _stripe
    return {
        "status": "ok",
        "stripe_sdk": getattr(_stripe, "VERSION", "desconhecida"),
    }


@app.post("/reconstruct")
async def reconstruct(req: ReconstructRequest, user_id: str = Depends(get_user_id)):
    """Inicia o processamento 3D de um modelo. user_id vem do token (não do body)."""
    try:
        sb = get_supabase()

        # Verificar que o modelo pertence ao utilizador autenticado
        owner = sb.table("models").select("user_id").eq("id", req.model_id).single().execute()
        if not owner.data or owner.data["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Este modelo não te pertence.")

        # Verificar limite do plano
        allowed, reason = await check_plan_limit(user_id)
        if not allowed:
            raise HTTPException(status_code=402, detail=reason)

        # Marca de água: só o plano grátis tem marca de água Snap3D
        plan = await get_plan(user_id)
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
        await increment_model_count(user_id)

        # Disparar job assíncrono no Modal.com
        trigger_reconstruction(req.model_id, user_id, req.input_type)

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
async def checkout(req: CheckoutRequest, user_id: str = Depends(get_user_id)):
    """Cria uma sessão de checkout do Stripe para subscrever um plano."""
    try:
        url = create_checkout_session(user_id, req.plan)
        return {"url": url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro em /create-checkout-session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/create-portal-session")
async def portal(req: PortalRequest, user_id: str = Depends(get_user_id)):
    """Cria uma sessão do portal de cliente Stripe (gerir/cancelar)."""
    try:
        url = create_portal_session(user_id)
        return {"url": url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro em /create-portal-session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/welcome")
async def welcome(user_id: str = Depends(get_user_id)):
    """Envia email de boas-vindas (uma vez por utilizador). Idempotente."""
    try:
        sb = get_supabase()
        profile = sb.table("user_profiles").select("welcomed").eq("id", user_id).single().execute()
        if profile.data and profile.data.get("welcomed"):
            return {"sent": False, "reason": "already welcomed"}
        email = _user_email(sb, user_id)
        sent = send_welcome_email(email) if email else False
        # Só marca como 'welcomed' se o email foi mesmo enviado (senão tenta de novo)
        if sent:
            sb.table("user_profiles").update({"welcomed": True}).eq("id", user_id).execute()
        return {"sent": sent}
    except Exception as e:
        logger.error(f"Erro em /welcome: {e}")
        return {"sent": False}


@app.post("/notify-model-ready")
async def notify_model_ready(req: NotifyReadyRequest):
    """Chamado pelo Modal quando um modelo fica pronto — envia email ao dono."""
    try:
        sb = get_supabase()
        model = sb.table("models").select("name, user_id").eq("id", req.model_id).single().execute()
        if not model.data:
            return {"sent": False}
        email = _user_email(sb, model.data["user_id"])
        if email:
            send_model_ready_email(email, model.data.get("name", "modelo"), req.model_id)
        return {"sent": bool(email)}
    except Exception as e:
        logger.error(f"Erro em /notify-model-ready: {e}")
        return {"sent": False}


@app.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Recebe eventos do Stripe (pagamentos, cancelamentos)."""
    body = await request.body()
    await handle_stripe_webhook(body, stripe_signature)
    return {"received": True}
