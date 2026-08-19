from datetime import datetime, timezone
from supabase_utils import get_supabase

PLAN_LIMITS = {
    "free":    3,
    "creator": 25,
    "pro":     float("inf"),
}


def _needs_monthly_reset(reset_at: str | None, now: datetime) -> bool:
    """True se estamos num mês de calendário diferente do último reset."""
    if not reset_at:
        return True
    try:
        dt = datetime.fromisoformat(str(reset_at).replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return True
    return (dt.year, dt.month) != (now.year, now.month)


async def check_plan_limit(user_id: str) -> tuple[bool, str]:
    """Verifica se o utilizador ainda tem modelos disponíveis este mês.
    Repõe automaticamente o contador no início de cada mês."""
    sb = get_supabase()
    result = sb.table("user_profiles").select(
        "plan, models_this_month, models_reset_at"
    ).eq("id", user_id).single().execute()

    if not result.data:
        return False, "Perfil de utilizador não encontrado."

    plan = result.data["plan"]
    used = result.data["models_this_month"]
    now = datetime.now(timezone.utc)

    # Reset automático mensal
    if _needs_monthly_reset(result.data.get("models_reset_at"), now):
        sb.table("user_profiles").update({
            "models_this_month": 0,
            "models_reset_at": now.isoformat(),
        }).eq("id", user_id).execute()
        used = 0

    limit = PLAN_LIMITS.get(plan, 3)

    if used >= limit:
        return False, f"Atingiste o limite de {limit} modelos/mês do plano {plan}. Faz upgrade para continuar."

    return True, "ok"


async def get_plan(user_id: str) -> str:
    """Devolve o plano atual do utilizador ('free' por defeito)."""
    sb = get_supabase()
    result = sb.table("user_profiles").select("plan").eq("id", user_id).single().execute()
    if not result.data:
        return "free"
    return result.data.get("plan", "free")


async def decrement_model_count(user_id: str):
    """Devolve uma unidade da quota mensal.

    Chamado quando a geração falha: o contador é incrementado antes de o
    trabalho começar, e seria injusto o cliente perder um modelo por um erro
    nosso. Nunca desce abaixo de zero.
    """
    sb = get_supabase()
    profile = sb.table("user_profiles").select("models_this_month").eq("id", user_id).single().execute()
    current = profile.data.get("models_this_month", 0) if profile.data else 0
    sb.table("user_profiles").update(
        {"models_this_month": max(0, current - 1)}
    ).eq("id", user_id).execute()


async def increment_model_count(user_id: str):
    """Incrementa o contador de modelos criados este mês."""
    sb = get_supabase()
    profile = sb.table("user_profiles").select("models_this_month").eq("id", user_id).single().execute()
    current = profile.data.get("models_this_month", 0) if profile.data else 0
    sb.table("user_profiles").update({"models_this_month": current + 1}).eq("id", user_id).execute()
