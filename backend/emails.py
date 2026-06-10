"""
Envio de emails transacionais via Resend.
Requer RESEND_API_KEY. EMAIL_FROM define o remetente (ex: 'Snap3D <ola@teudominio.com>').
Sem domínio verificado, usa 'onboarding@resend.dev' (só envia para o teu próprio email).
"""
import os
import logging
import httpx

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "Snap3D <onboarding@resend.dev>")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://scan3d-app.vercel.app")


def _send(to: str, subject: str, html: str) -> bool:
    """Envia um email. Devolve True se OK, False se falhar (não rebenta o fluxo)."""
    if not RESEND_API_KEY or not to:
        logger.info("Email não enviado (RESEND_API_KEY/destinatário em falta).")
        return False
    try:
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            json={"from": EMAIL_FROM, "to": [to], "subject": subject, "html": html},
            timeout=15,
        )
        if resp.status_code >= 300:
            logger.error(f"Resend erro {resp.status_code}: {resp.text[:200]}")
            return False
        return True
    except Exception as e:
        logger.error(f"Erro ao enviar email: {e}")
        return False


def _wrap(title: str, body_html: str, cta_text: str, cta_url: str) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0a0a0a">
      <h1 style="font-size:22px;margin-bottom:8px">{title}</h1>
      <div style="color:#444;font-size:15px;line-height:1.6">{body_html}</div>
      <a href="{cta_url}" style="display:inline-block;margin-top:20px;background:#0ea5e9;color:#fff;
         text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">{cta_text}</a>
      <p style="color:#999;font-size:12px;margin-top:28px">Snap3D · modelos 3D para e-commerce</p>
    </div>
    """


def send_welcome_email(to: str):
    html = _wrap(
        "Bem-vindo ao Snap3D! 🎉",
        "A tua conta está pronta. Carrega 4 a 6 fotos de um produto e a nossa IA "
        "cria um modelo 3D fotorrealista em minutos.<br><br>Tens <b>3 modelos grátis</b> este mês.",
        "Criar o meu primeiro modelo",
        f"{FRONTEND_URL}/upload",
    )
    return _send(to, "Bem-vindo ao Snap3D 🎉", html)


def send_model_ready_email(to: str, model_name: str, model_id: str):
    html = _wrap(
        "O teu modelo 3D está pronto! ✨",
        f'O modelo <b>"{model_name}"</b> foi gerado com sucesso e já podes vê-lo, '
        "descarregá-lo ou incorporá-lo na tua loja.",
        "Ver o modelo 3D",
        f"{FRONTEND_URL}/model/{model_id}",
    )
    return _send(to, f'O teu modelo "{model_name}" está pronto ✨', html)
