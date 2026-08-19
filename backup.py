"""
Cópia de segurança da base de dados do Snap3D.

O plano gratuito do Supabase não inclui backups. Sem a base de dados perde-se
a ligação entre clientes, planos e pagamentos da Stripe — mesmo que os
ficheiros 3D sobrevivam no Storage.

Como usar (a partir da pasta do projeto):

    python backup.py

Lê as credenciais de backend/.env. Escreve um ficheiro JSON com data em
backups/. Guarda-o fora deste computador (Drive, Dropbox, disco externo).

Recomendação: correr uma vez por semana. Enquanto o negócio for pequeno isto
chega; com clientes a sério, passar ao plano pago do Supabase, que faz
backups diários automáticos.
"""
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import httpx

RAIZ = Path(__file__).parent
TABELAS = ["user_profiles", "models"]


def carregar_credenciais() -> tuple[str, str]:
    env = RAIZ / "backend" / ".env"
    if not env.exists():
        raise SystemExit(f"Não encontrei {env}")

    valores = {}
    for linha in env.read_text(encoding="utf-8").splitlines():
        if "=" in linha and not linha.strip().startswith("#"):
            chave, _, valor = linha.partition("=")
            valores[chave.strip()] = valor.strip()

    url = valores.get("SUPABASE_URL")
    chave = valores.get("SUPABASE_SERVICE_KEY")
    if not url or not chave:
        raise SystemExit("Faltam SUPABASE_URL ou SUPABASE_SERVICE_KEY no backend/.env")
    return url, chave


def exportar() -> Path:
    url, chave = carregar_credenciais()
    cabecalhos = {"apikey": chave, "Authorization": f"Bearer {chave}"}

    dados = {
        "exportado_em": datetime.now(timezone.utc).isoformat(),
        "tabelas": {},
    }

    with httpx.Client(timeout=60) as cliente:
        for tabela in TABELAS:
            resposta = cliente.get(
                f"{url}/rest/v1/{tabela}",
                params={"select": "*"},
                headers=cabecalhos,
            )
            resposta.raise_for_status()
            linhas = resposta.json()
            dados["tabelas"][tabela] = linhas
            print(f"  {tabela}: {len(linhas)} registos")

    pasta = RAIZ / "backups"
    pasta.mkdir(exist_ok=True)
    destino = pasta / f"snap3d-{datetime.now().strftime('%Y-%m-%d')}.json"
    destino.write_text(json.dumps(dados, indent=2, ensure_ascii=False), encoding="utf-8")
    return destino


if __name__ == "__main__":
    print("A exportar a base de dados...")
    ficheiro = exportar()
    tamanho = ficheiro.stat().st_size / 1024
    print(f"\nGuardado em {ficheiro} ({tamanho:.0f} KB)")
    print("Copia este ficheiro para fora do computador.")
