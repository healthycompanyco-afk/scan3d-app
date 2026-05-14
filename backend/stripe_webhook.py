import os
import stripe
from supabase_utils import get_supabase

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")

# Mapeia price_id do Stripe para o nome do plano
PRICE_TO_PLAN = {
    "price_1TX6Jg2Fyj45YCYbf2NgyGyJ": "creator",
    "price_1TX6K82Fyj45YCYbhmih3ZQa": "pro",
}


async def handle_stripe_webhook(body: bytes, signature: str):
    webhook_secret = os.environ["STRIPE_WEBHOOK_SECRET"]
    try:
        event = stripe.Webhook.construct_event(body, signature, webhook_secret)
    except stripe.error.SignatureVerificationError:
        return

    sb = get_supabase()

    if event["type"] == "customer.subscription.created" or event["type"] == "customer.subscription.updated":
        sub = event["data"]["object"]
        customer_id = sub["customer"]
        price_id = sub["items"]["data"][0]["price"]["id"]
        plan = PRICE_TO_PLAN.get(price_id, "free")
        # Atualizar plano do utilizador com base no customer_id do Stripe
        sb.table("user_profiles").update({"plan": plan}).eq("stripe_customer_id", customer_id).execute()

    elif event["type"] == "customer.subscription.deleted":
        sub = event["data"]["object"]
        customer_id = sub["customer"]
        sb.table("user_profiles").update({"plan": "free"}).eq("stripe_customer_id", customer_id).execute()
