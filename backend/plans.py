from supabase_utils import get_supabase

PLAN_LIMITS = {
    "free":    3,
    "creator": 25,
    "pro":     float("inf"),
}


async def check_plan_limit(user_id: str) -> tuple[bool, str]:
    """Verifica se o utilizador ainda tem modelos disponíveis este mês."""
    sb = get_supabase()
    result = sb.table("user_profiles").select("plan, models_this_month").eq("id", user_id).single().execute()

    if not result.data:
        return False, "Perfil de utilizador não encontrado."

    plan = result.data["plan"]
    used = result.data["models_this_month"]
    limit = PLAN_LIMITS.get(plan, 3)

    if used >= limit:
        return False, f"Atingiste o limite de {limit} modelos/mês do plano {plan}. Faz upgrade para continuar."

    return True, "ok"


async def increment_model_count(user_id: str):
    """Incrementa o contador de modelos criados este mês."""
    sb = get_supabase()
    profile = sb.table("user_profiles").select("models_this_month").eq("id", user_id).single().execute()
    current = profile.data.get("models_this_month", 0) if profile.data else 0
    sb.table("user_profiles").update({"models_this_month": current + 1}).eq("id", user_id).execute()
