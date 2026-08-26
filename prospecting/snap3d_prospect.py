"""
Ferramenta de prospeção do Snap3D.

Faz o trabalho mecânico da angariação: extrair fotos de uma página de produto,
gerar o modelo 3D e manter o registo de quem já foi contactado.

NÃO envia mensagens. Isso é deliberado — ver prospecting/README.md.

Comandos:

    python snap3d_prospect.py quem-sou --email pedro@exemplo.pt
    python snap3d_prospect.py fotos https://loja.pt/produto/xpto
    python snap3d_prospect.py gerar --slug xpto --nome "Jarra de barro"
    python snap3d_prospect.py estado
    python snap3d_prospect.py registar --slug xpto --loja "Olaria X" --nicho artesanato
    python snap3d_prospect.py enviado --slug xpto --canal instagram
    python snap3d_prospect.py resposta --slug xpto --resultado interessado

Credenciais: lê backend/.env e prospecting/.env (ver .env.example).
"""
import argparse
import io
import json
import mimetypes
import re
import sys
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

import httpx

RAIZ = Path(__file__).resolve().parent.parent
AQUI = Path(__file__).resolve().parent
TRABALHO = AQUI / "trabalho"
REGISTO = AQUI / "prospetos.json"

FRONTEND = "https://snap3d.app"

# Imagens mais pequenas que isto são quase sempre logótipos, ícones ou pixéis
# de tracking. 40 KB é um limiar grosseiro mas eficaz.
MIN_BYTES = 40_000


# ------------------------------------------------------------------
# Credenciais
# ------------------------------------------------------------------
def ler_env() -> dict:
    valores = {}
    for ficheiro in (RAIZ / "backend" / ".env", AQUI / ".env"):
        if not ficheiro.exists():
            continue
        for linha in ficheiro.read_text(encoding="utf-8").splitlines():
            linha = linha.strip()
            if "=" in linha and not linha.startswith("#"):
                chave, _, valor = linha.partition("=")
                valores[chave.strip()] = valor.strip()
    return valores


def exigir(env: dict, *chaves: str) -> list:
    em_falta = [c for c in chaves if not env.get(c)]
    if em_falta:
        raise SystemExit(
            "Faltam variáveis: " + ", ".join(em_falta) +
            "\nVê prospecting/.env.example."
        )
    return [env[c] for c in chaves]


def cabecalhos(chave: str) -> dict:
    return {"apikey": chave, "Authorization": f"Bearer {chave}"}


# ------------------------------------------------------------------
# Registo de prospetos (ficheiro JSON local)
# ------------------------------------------------------------------
def carregar_registo() -> dict:
    if REGISTO.exists():
        return json.loads(REGISTO.read_text(encoding="utf-8"))
    return {}


def gravar_registo(dados: dict) -> None:
    REGISTO.write_text(
        json.dumps(dados, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def actualizar(slug: str, **campos) -> dict:
    registo = carregar_registo()
    entrada = registo.setdefault(slug, {"slug": slug, "criado": agora()})
    entrada.update({k: v for k, v in campos.items() if v is not None})
    gravar_registo(registo)
    return entrada


def agora() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def fazer_slug(texto: str) -> str:
    limpo = re.sub(r"[^a-z0-9]+", "-", texto.lower()).strip("-")
    return limpo[:50] or "prospeto"


# ------------------------------------------------------------------
# Extração de imagens de uma página de produto
# ------------------------------------------------------------------
class ColectorDeImagens(HTMLParser):
    """Recolhe candidatos a foto de produto: og:image, <img>, srcset."""

    def __init__(self):
        super().__init__()
        self.urls: list[str] = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta" and a.get("property") in ("og:image", "og:image:secure_url"):
            self._juntar(a.get("content"))
        elif tag == "img":
            for atributo in ("src", "data-src", "data-original", "data-lazy-src"):
                self._juntar(a.get(atributo))
            # No srcset a última entrada é normalmente a de maior resolução
            if a.get("srcset"):
                partes = [p.strip().split(" ")[0] for p in a["srcset"].split(",")]
                self._juntar(partes[-1] if partes else None)
        elif tag == "source" and a.get("srcset"):
            partes = [p.strip().split(" ")[0] for p in a["srcset"].split(",")]
            self._juntar(partes[-1] if partes else None)

    def _juntar(self, url):
        if url and url not in self.urls:
            self.urls.append(url)


def ampliar(url: str) -> str:
    """Pede a versão grande da imagem.

    Shopify e WooCommerce servem miniaturas com o tamanho no nome do ficheiro
    (`camisa_600x600.jpg`, `mesa-300x300.png`). Tirar esse sufixo devolve o
    original, que é o que interessa para gerar o modelo.
    """
    url = re.sub(r"_\d+x\d*(?=\.(jpg|jpeg|png|webp))", "", url, flags=re.I)
    url = re.sub(r"-\d{2,4}x\d{2,4}(?=\.(jpg|jpeg|png|webp))", "", url, flags=re.I)
    return url


def fotos_shopify(cliente: httpx.Client, url_pagina: str) -> list[str]:
    """Fotos do produto pela via oficial do Shopify.

    Raspar o HTML de uma loja Shopify traz banners, produtos relacionados e
    imagens de campanha. O endpoint `/products/<handle>.js` devolve só as
    imagens daquele produto — que é exatamente o que queremos.
    """
    match = re.search(r"^(https?://[^/]+).*?/products/([^/?#]+)", url_pagina)
    if not match:
        return []
    origem, handle = match.groups()
    try:
        r = cliente.get(f"{origem}/products/{handle}.js")
        # O Shopify serve isto como application/javascript, não como json
        if r.status_code != 200:
            return []
        imagens = json.loads(r.text).get("images", [])
    except (httpx.HTTPError, ValueError):
        return []
    return [urljoin(url_pagina, i) for i in imagens if isinstance(i, str)]


def extrair_fotos(url_pagina: str, maximo: int, slug: str) -> Path:
    with httpx.Client(follow_redirects=True, timeout=30,
                      headers={"User-Agent": "Mozilla/5.0 (Snap3D prospect tool)"}) as cliente:
        resposta = cliente.get(url_pagina)
        resposta.raise_for_status()
        html = resposta.text

        # Um produto esgotado ou removido redireciona para a coleção. Se isso
        # acontecer sem aviso, acabas a gerar um modelo de um banner.
        if str(resposta.url).rstrip("/") != url_pagina.rstrip("/"):
            print(f"AVISO: a página redirecionou para {resposta.url}")
            print("Se isto não é a página do produto, o produto já não existe.")

        # Via oficial do Shopify primeiro: só traz fotos deste produto
        candidatas = fotos_shopify(cliente, url_pagina)
        if candidatas:
            print("Loja Shopify — fotos obtidas diretamente do produto.")

        # JSON-LD costuma trazer as fotos do produto já limpas de decoração.
        # Só vale a pena se o Shopify não respondeu; senão estraga a ordem boa.
        if not candidatas:
            for bloco in re.findall(
                r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', html, re.S | re.I
            ):
                for achado in re.findall(
                    r'"(https?://[^"]+\.(?:jpg|jpeg|png|webp))"', bloco, re.I
                ):
                    if achado not in candidatas:
                        candidatas.append(achado)
            colector = ColectorDeImagens()
            colector.feed(html)
            candidatas += [u for u in colector.urls if u not in candidatas]

        vistas, absolutas = set(), []
        for bruta in candidatas:
            if bruta.startswith("data:") or bruta.lower().endswith((".svg", ".gif")):
                continue
            original = urljoin(url_pagina, bruta)
            chave = original.split("?")[0]
            if chave not in vistas:
                vistas.add(chave)
                # Tentar a versão grande, mas guardar o original: nem sempre o
                # sufixo de tamanho é um sufixo de tamanho.
                absolutas.append((ampliar(original), original))

        destino = TRABALHO / slug
        destino.mkdir(parents=True, exist_ok=True)
        for antiga in destino.glob("*"):
            antiga.unlink()

        guardadas, tentativas = [], 0
        for url_grande, url_img in absolutas:
            if len(guardadas) >= maximo or tentativas >= 40:
                break
            tentativas += 1
            try:
                img = cliente.get(url_grande)
                if img.status_code != 200 and url_grande != url_img:
                    img = cliente.get(url_img)
                if img.status_code != 200:
                    continue
                if not img.headers.get("content-type", "").startswith("image/"):
                    continue
                if len(img.content) < MIN_BYTES:
                    continue
                extensao = mimetypes.guess_extension(
                    img.headers["content-type"].split(";")[0]
                ) or ".jpg"
                if extensao == ".jpe":
                    extensao = ".jpg"
                caminho = destino / f"foto_{len(guardadas)}{extensao}"
                caminho.write_bytes(img.content)
                guardadas.append((caminho, len(img.content), url_img))
            except httpx.HTTPError:
                continue

    if not guardadas:
        raise SystemExit(
            "Não encontrei fotos utilizáveis nesta página.\n"
            "Provavelmente é uma loja que carrega as imagens por JavaScript. "
            "Guarda as fotos à mão em " + str(destino)
        )

    print(f"\n{len(guardadas)} fotos guardadas em {destino}\n")
    for caminho, tamanho, origem in guardadas:
        print(f"  {caminho.name:<14} {tamanho // 1024:>5} KB   {origem[:80]}")
    print(
        "\nVê as fotos antes de gerar. Precisas de 4-6 do MESMO objeto, de ângulos\n"
        "diferentes. Apaga as que forem de outros produtos, ambiente ou pessoas."
    )
    return destino


# ------------------------------------------------------------------
# Geração do modelo
# ------------------------------------------------------------------
def gerar_modelo(slug: str, nome: str, env: dict) -> str:
    url_sb, chave, user_id, url_modal = exigir(
        env, "SUPABASE_URL", "SUPABASE_SERVICE_KEY", "SNAP3D_USER_ID", "MODAL_TRELLIS_URL"
    )

    pasta = TRABALHO / slug
    fotos = sorted(
        p for p in pasta.glob("*")
        if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")
    )
    if not fotos:
        raise SystemExit(f"Sem fotos em {pasta}. Corre primeiro o comando 'fotos'.")
    if len(fotos) > 6:
        raise SystemExit(f"{len(fotos)} fotos — o máximo é 6. Apaga as piores.")

    cab = cabecalhos(chave)
    with httpx.Client(timeout=60) as cliente:
        # 1. Linha na base de dados.
        #    is_public: o destinatário abre o link sem ter conta.
        #    gallery=False: não vai para a homepage — as fotos são da loja dele.
        #    watermark: a marca de água é o ponto, é ela que faz a publicidade.
        #    expires_at NULL: um link oferecido não pode morrer daqui a 30 dias.
        criacao = cliente.post(
            f"{url_sb}/rest/v1/models",
            headers={**cab, "Content-Type": "application/json",
                     "Prefer": "return=representation"},
            json={
                "user_id": user_id, "name": nome, "input_type": "ai_single",
                "status": "pending", "is_public": True, "gallery": False,
                "watermark": True, "expires_at": None,
                "frames_count": len(fotos),
            },
        )
        criacao.raise_for_status()
        model_id = criacao.json()[0]["id"]

        # 2. Fotos para o bucket privado de entrada
        for foto in fotos:
            tipo = mimetypes.guess_type(foto.name)[0] or "image/jpeg"
            envio = cliente.post(
                f"{url_sb}/storage/v1/object/uploads/{user_id}/{model_id}/{foto.name}",
                headers={**cab, "Content-Type": tipo},
                content=foto.read_bytes(),
            )
            envio.raise_for_status()

        # 3. Disparar a GPU. Chamamos o Modal diretamente em vez do /reconstruct
        #    para não gastar quota da tua conta nem passar pelas regras de plano.
        disparo = cliente.post(
            url_modal, json={"model_id": model_id, "user_id": user_id}, timeout=30
        )
        if disparo.status_code not in (200, 202):
            cliente.patch(
                f"{url_sb}/rest/v1/models?id=eq.{model_id}",
                headers={**cab, "Content-Type": "application/json"},
                json={"status": "error", "error_msg": disparo.text[:300]},
            )
            raise SystemExit(f"Modal recusou ({disparo.status_code}): {disparo.text[:300]}")

    link = f"{FRONTEND}/model/{model_id}"
    actualizar(slug, nome_produto=nome, model_id=model_id, link=link,
               gerado=agora(), fotos=len(fotos))
    print(f"\nModelo em construção: {link}")
    print("Demora 5-10 minutos. Vê o progresso com:  python snap3d_prospect.py estado")
    return model_id


# ------------------------------------------------------------------
# Estado
# ------------------------------------------------------------------
def ver_estado(env: dict, slug: str | None) -> None:
    url_sb, chave = exigir(env, "SUPABASE_URL", "SUPABASE_SERVICE_KEY")
    registo = carregar_registo()
    entradas = [registo[slug]] if slug else list(registo.values())
    entradas = [e for e in entradas if e.get("model_id")]

    if not entradas:
        print("Ainda não há modelos gerados.")
        return

    ids = ",".join(e["model_id"] for e in entradas)
    with httpx.Client(timeout=30) as cliente:
        r = cliente.get(
            f"{url_sb}/rest/v1/models",
            headers=cabecalhos(chave),
            params={"id": f"in.({ids})", "select": "id,status,error_msg"},
        )
        r.raise_for_status()
    estados = {m["id"]: m for m in r.json()}

    print(f"\n{'prospeto':<24}{'produto':<24}{'estado':<12}enviado")
    print("-" * 78)
    for e in sorted(entradas, key=lambda x: x.get("criado", "")):
        m = estados.get(e["model_id"], {})
        estado = m.get("status", "?")
        if estado == "error":
            estado = "ERRO"
        print(f"{e['slug'][:23]:<24}{str(e.get('nome_produto', ''))[:23]:<24}"
              f"{estado:<12}{e.get('enviado', '—')[:10]}")
        if m.get("error_msg"):
            print(f"    └─ {m['error_msg'][:70]}")
    print()
    prontos = [e for e in entradas if estados.get(e["model_id"], {}).get("status") == "done"
               and not e.get("enviado")]
    if prontos:
        print("Prontos a enviar:")
        for e in prontos:
            print(f"  {e['slug']}: {e['link']}")
        print()


def listar(_env, slug=None) -> None:
    registo = carregar_registo()
    if not registo:
        print("Registo vazio.")
        return
    print(json.dumps(registo[slug] if slug else registo, indent=2, ensure_ascii=False))


def quem_sou(env: dict, email: str) -> None:
    url_sb, chave = exigir(env, "SUPABASE_URL", "SUPABASE_SERVICE_KEY")
    with httpx.Client(timeout=30) as cliente:
        r = cliente.get(f"{url_sb}/auth/v1/admin/users",
                        headers=cabecalhos(chave), params={"per_page": 200})
        r.raise_for_status()
    for u in r.json().get("users", []):
        if u.get("email", "").lower() == email.lower():
            print(f"\nSNAP3D_USER_ID={u['id']}\n\nCola esta linha em prospecting/.env")
            return
    raise SystemExit(f"Não encontrei nenhum utilizador com o email {email}.")


# ------------------------------------------------------------------
def main() -> None:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("quem-sou", help="descobre o teu SNAP3D_USER_ID")
    c.add_argument("--email", required=True)

    c = sub.add_parser("fotos", help="extrai fotos de uma página de produto")
    c.add_argument("url")
    c.add_argument("--slug", help="nome da pasta de trabalho (por omissão vem do URL)")
    c.add_argument("--max", type=int, default=6)

    c = sub.add_parser("gerar", help="gera o modelo 3D a partir das fotos guardadas")
    c.add_argument("--slug", required=True)
    c.add_argument("--nome", required=True, help="nome do produto, como aparece na loja")

    c = sub.add_parser("estado", help="mostra o estado dos modelos")
    c.add_argument("--slug")

    c = sub.add_parser("lista", help="mostra o registo em bruto")
    c.add_argument("--slug")

    c = sub.add_parser("registar", help="guarda os dados do prospeto")
    c.add_argument("--slug", required=True)
    c.add_argument("--loja")
    c.add_argument("--url")
    c.add_argument("--nicho", choices=["artesanato", "vestuario", "mobiliario"])
    c.add_argument("--contacto", help="instagram, email ou formulário")
    c.add_argument("--notas")

    c = sub.add_parser("enviado", help="marca como contactado")
    c.add_argument("--slug", required=True)
    c.add_argument("--canal", required=True, choices=["instagram", "email", "presencial", "outro"])

    c = sub.add_parser("resposta", help="regista o desfecho")
    c.add_argument("--slug", required=True)
    c.add_argument("--resultado", required=True,
                   choices=["sem-resposta", "interessado", "registou", "pagou", "nao"])
    c.add_argument("--notas")

    args = p.parse_args()
    env = ler_env()

    if args.cmd == "quem-sou":
        quem_sou(env, args.email)
    elif args.cmd == "fotos":
        slug = args.slug or fazer_slug(urlparse(args.url).path.rstrip("/").split("/")[-1]
                                       or urlparse(args.url).netloc)
        extrair_fotos(args.url, args.max, slug)
        actualizar(slug, url_produto=args.url)
        print(f"slug: {slug}")
    elif args.cmd == "gerar":
        gerar_modelo(args.slug, args.nome, env)
    elif args.cmd == "estado":
        ver_estado(env, args.slug)
    elif args.cmd == "lista":
        listar(env, args.slug)
    elif args.cmd == "registar":
        e = actualizar(args.slug, loja=args.loja, url_loja=args.url,
                       nicho=args.nicho, contacto=args.contacto, notas=args.notas)
        print(json.dumps(e, indent=2, ensure_ascii=False))
    elif args.cmd == "enviado":
        actualizar(args.slug, enviado=agora(), canal=args.canal)
        print(f"{args.slug}: marcado como enviado por {args.canal}")
    elif args.cmd == "resposta":
        actualizar(args.slug, resultado=args.resultado, respondido=agora(), notas=args.notas)
        print(f"{args.slug}: {args.resultado}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
