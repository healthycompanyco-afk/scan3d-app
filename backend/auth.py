"""
Autenticação: valida o JWT do Supabase enviado pelo frontend
(header Authorization: Bearer <token>) e devolve o user_id real.
Impede que alguém use o user_id de outra pessoa.
"""
import logging
from fastapi import Header, HTTPException
from supabase_utils import get_supabase

logger = logging.getLogger(__name__)


def get_user_id(authorization: str = Header(None)) -> str:
    """Dependência FastAPI — devolve o user_id autenticado ou 401."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Sessão em falta. Faz login novamente.")
    token = authorization.split(" ", 1)[1].strip()
    try:
        sb = get_supabase()
        res = sb.auth.get_user(token)
        if not res or not res.user:
            raise HTTPException(status_code=401, detail="Sessão inválida.")
        return res.user.id
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Token inválido: {e}")
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada.")
