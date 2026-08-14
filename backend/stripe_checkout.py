import os
import logging
import stripe
from supabase_utils import get_supabase

logger = logging.getLogger(__name__)

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://snap3d.app")

# Plano → price_id do Stripe. Sem valores por omissão de propósito: em produção
# os IDs são diferentes dos de teste, e um default silencioso levaria a cobrar
# pelo preço errado ou a não reconhecer o plano no webhook.
PLAN_PRICE = {
    "creator": os.environ.get("STRIPE_PRICE_CREATOR", ""),
    "pro":     os.environ.get("STRIPE_PRICE_PRO", ""),
}


def _get_user_email(sb, user_id: str) -> str | None:
    """Tenta obter o email do utilizador (para o cliente Stripe)."""
    try:
        res = sb.auth.admin.get_user_by_id(user_id)
        return res.user.email if res and res.user else None
    except Exception:
        return None


def _ensure_customer(sb, user_id: str) -> str:
    """Devolve o stripe_customer_id do utilizador, criando-o se necessário."""
    profile = sb.table("user_profiles").select("stripe_customer_id").eq("id", user_id).single().execute()
    customer_id = profile.data.get("stripe_customer_id") if profile.data else None

    if customer_id:
        return customer_id

    email = _get_user_email(sb, user_id)
    customer = stripe.Customer.create(
        email=email,
        metadata={"user_id": user_id},
    )
    sb.table("user_profiles").update(
        {"stripe_customer_id": customer.id}
    ).eq("id", user_id).execute()
    return customer.id


def create_checkout_session(user_id: str, plan: str) -> str:
    """Cria uma sessão de checkout do Stripe e devolve o URL."""
    if plan not in PLAN_PRICE:
        raise ValueError(f"Plano inválido: {plan}")
    if not PLAN_PRICE[plan]:
        env_var = f"STRIPE_PRICE_{plan.upper()}"
        logger.error(f"{env_var} não está definida — checkout impossível.")
        raise ValueError(
            "Pagamentos temporariamente indisponíveis. Já fomos notificados."
        )

    sb = get_supabase()
    customer_id = _ensure_customer(sb, user_id)

    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=customer_id,
        line_items=[{"price": PLAN_PRICE[plan], "quantity": 1}],
        success_url=f"{FRONTEND_URL}/dashboard?upgraded=1",
        cancel_url=f"{FRONTEND_URL}/pricing",
        allow_promotion_codes=True,
    )
    return session.url


def create_portal_session(user_id: str) -> str:
    """Cria uma sessão do portal de cliente (gerir/cancelar subscrição)."""
    sb = get_supabase()
    profile = sb.table("user_profiles").select("stripe_customer_id").eq("id", user_id).single().execute()
    customer_id = profile.data.get("stripe_customer_id") if profile.data else None
    if not customer_id:
        raise ValueError("Utilizador sem subscrição ativa.")

    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{FRONTEND_URL}/dashboard",
    )
    return session.url
