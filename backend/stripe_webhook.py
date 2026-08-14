import os
import logging
import stripe
from fastapi import HTTPException
from supabase_utils import get_supabase
from stripe_checkout import PLAN_PRICE

logger = logging.getLogger(__name__)

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")

# Deriva o mapa price_id → plano a partir da configuração do checkout,
# para que teste e produção nunca fiquem dessincronizados.
PRICE_TO_PLAN = {price: plan for plan, price in PLAN_PRICE.items()}

# 'past_due' mantém o acesso: a Stripe volta a tentar cobrar durante dias e
# só depois cancela (aí chega o evento .deleted). Despromover logo à primeira
# falha de cartão seria punir o cliente por algo temporário.
ACTIVE_STATUSES = {"active", "trialing", "past_due"}


def _set_plan(sb, customer_id: str, plan: str):
    result = sb.table("user_profiles").update({"plan": plan}).eq(
        "stripe_customer_id", customer_id
    ).execute()
    if not result.data:
        logger.error(f"Webhook: nenhum perfil com stripe_customer_id={customer_id}")
    else:
        logger.info(f"Webhook: cliente {customer_id} passou a plano '{plan}'")


async def handle_stripe_webhook(body: bytes, signature: str):
    webhook_secret = os.environ["STRIPE_WEBHOOK_SECRET"]
    try:
        event = stripe.Webhook.construct_event(body, signature, webhook_secret)
    except stripe.error.SignatureVerificationError:
        # 400 para a Stripe registar a falha (silenciar esconderia um segredo errado)
        logger.error("Webhook Stripe com assinatura inválida.")
        raise HTTPException(status_code=400, detail="Assinatura inválida.")

    sb = get_supabase()
    etype = event["type"]

    if etype in ("customer.subscription.created", "customer.subscription.updated"):
        sub = event["data"]["object"]
        customer_id = sub["customer"]
        status = sub.get("status")
        price_id = sub["items"]["data"][0]["price"]["id"]

        if status not in ACTIVE_STATUSES:
            # incomplete / canceled / unpaid → sem acesso pago
            logger.info(f"Webhook: subscrição {status} para {customer_id} → free")
            _set_plan(sb, customer_id, "free")
            return

        plan = PRICE_TO_PLAN.get(price_id)
        if not plan:
            # Preço desconhecido = configuração errada. Não despromover um
            # cliente que está mesmo a pagar; registar para investigação.
            logger.error(
                f"Webhook: price_id desconhecido '{price_id}' (cliente {customer_id}). "
                f"Confirma STRIPE_PRICE_CREATOR/STRIPE_PRICE_PRO."
            )
            return

        _set_plan(sb, customer_id, plan)

    elif etype == "customer.subscription.deleted":
        _set_plan(sb, event["data"]["object"]["customer"], "free")

    else:
        logger.info(f"Webhook: evento ignorado ({etype})")
