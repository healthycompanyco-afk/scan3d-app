from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

from supabase_utils import get_supabase
from plans import check_plan_limit, increment_model_count
from modal_runner import trigger_reconstruction
from stripe_webhook import handle_stripe_webhook

load_dotenv()

app = FastAPI(title="Scan3D API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # em produção: especifica o domínio do frontend
    allow_methods=["*"],
    allow_headers=["*"],
)


class ReconstructRequest(BaseModel):
    model_id: str
    user_id: str
    input_type: str  # 'photos' | 'video'


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/reconstruct")
async def reconstruct(req: ReconstructRequest):
    """Inicia o processamento 3D de um modelo."""
    sb = get_supabase()

    # Verificar limite do plano
    allowed, reason = await check_plan_limit(req.user_id)
    if not allowed:
        raise HTTPException(status_code=402, detail=reason)

    # Atualizar estado para 'extracting' (vídeo) ou 'processing' (fotos)
    initial_status = "extracting" if req.input_type == "video" else "processing"
    sb.table("models").update({"status": initial_status}).eq("id", req.model_id).execute()

    # Incrementar contador de modelos do utilizador
    await increment_model_count(req.user_id)

    # Disparar job assíncrono no Modal.com
    trigger_reconstruction(req.model_id, req.user_id, req.input_type)

    return {"message": "Processamento iniciado", "model_id": req.model_id}


@app.get("/status/{model_id}")
async def get_status(model_id: str):
    """Devolve o estado atual de um modelo."""
    sb = get_supabase()
    result = sb.table("models").select("id, status, model_url, obj_url").eq("id", model_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Modelo não encontrado")
    return result.data


@app.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Recebe eventos do Stripe (pagamentos, cancelamentos)."""
    body = await request.body()
    await handle_stripe_webhook(body, stripe_signature)
    return {"received": True}
