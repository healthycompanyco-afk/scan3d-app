"""
Envio de emails transacionais via Resend, em português ou inglês.

O idioma vem da preferência guardada no perfil do utilizador (coluna `lang`),
definida quando ele usa o seletor PT/EN na aplicação.

Requer RESEND_API_KEY. EMAIL_FROM define o remetente.
"""
import os
import logging
import httpx

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "Snap3D <onboarding@resend.dev>")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://snap3d.app")

TEXTOS = {
    "welcome": {
        "pt": {
            "subject": "Bem-vindo ao Snap3D 🎉",
            "title": "Bem-vindo ao Snap3D! 🎉",
            "body": (
                "A tua conta está pronta. Carrega 4 a 6 fotos de um produto e "
                "recebes um modelo 3D fotorrealista em minutos.<br><br>"
                "Tens <b>3 modelos grátis</b> este mês."
            ),
            "cta": "Criar o meu primeiro modelo",
            "path": "/upload",
        },
        "en": {
            "subject": "Welcome to Snap3D 🎉",
            "title": "Welcome to Snap3D! 🎉",
            "body": (
                "Your account is ready. Upload 4 to 6 photos of a product and "
                "get a photorealistic 3D model in minutes.<br><br>"
                "You have <b>3 free models</b> this month."
            ),
            "cta": "Create my first model",
            "path": "/upload",
        },
    },
    "ready": {
        "pt": {
            "subject": 'O teu modelo "{nome}" está pronto ✨',
            "title": "O teu modelo 3D está pronto! ✨",
            "body": (
                'O modelo <b>"{nome}"</b> foi gerado com sucesso e já podes vê-lo, '
                "descarregá-lo ou incorporá-lo na tua loja."
            ),
            "cta": "Ver o modelo 3D",
            "path": "/model/{model_id}",
        },
        "en": {
            "subject": 'Your model "{nome}" is ready ✨',
            "title": "Your 3D model is ready! ✨",
            "body": (
                'The model <b>"{nome}"</b> was generated successfully. You can now view it, '
                "download it or embed it in your store."
            ),
            "cta": "View the 3D model",
            "path": "/model/{model_id}",
        },
    },
}

RODAPE = {
    "pt": "Snap3D · modelos 3D para e-commerce",
    "en": "Snap3D · 3D models for e-commerce",
}


def _normalizar(lang: str | None) -> str:
    return "en" if (lang or "pt").lower().startswith("en") else "pt"


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


def _wrap(title: str, body_html: str, cta_text: str, cta_url: str, lang: str) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0a0a0a">
      <h1 style="font-size:22px;margin-bottom:8px">{title}</h1>
      <div style="color:#444;font-size:15px;line-height:1.6">{body_html}</div>
      <a href="{cta_url}" style="display:inline-block;margin-top:20px;background:#0ea5e9;color:#fff;
         text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">{cta_text}</a>
      <p style="color:#999;font-size:12px;margin-top:28px">{RODAPE[lang]}</p>
    </div>
    """


def send_welcome_email(to: str, lang: str = "pt") -> bool:
    lang = _normalizar(lang)
    txt = TEXTOS["welcome"][lang]
    html = _wrap(txt["title"], txt["body"], txt["cta"], f"{FRONTEND_URL}{txt['path']}", lang)
    return _send(to, txt["subject"], html)


def send_model_ready_email(to: str, model_name: str, model_id: str, lang: str = "pt") -> bool:
    lang = _normalizar(lang)
    txt = TEXTOS["ready"][lang]
    caminho = txt["path"].format(model_id=model_id)
    html = _wrap(
        txt["title"],
        txt["body"].format(nome=model_name),
        txt["cta"],
        f"{FRONTEND_URL}{caminho}",
        lang,
    )
    return _send(to, txt["subject"].format(nome=model_name), html)
