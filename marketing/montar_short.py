"""
Monta um vídeo curto (TikTok / Reels / Shorts) a partir de um modelo do Snap3D.

Estrutura, ~15 segundos, formato vertical 1080x1920:

    1. as fotos de entrada, uma a uma          "N phone photos"
    2. cartão de corte                          "minutes later"
    3. o modelo a rodar, 4 voltas               (o giro verdadeiro, não IA)
    4. cartão final                             "snap3d.app"

Usa só ffmpeg. O giro vem do `turntable.mp4` que o job do Modal passou a
produzir — é o modelo real a rodar, não uma animação inventada.

Como usar:

    python montar_short.py --nome leao --legenda "Toy lion"

Espera encontrar:
    marketing/fotos/<nome>/*.jpg     fotos de entrada
    marketing/video/<nome>.mp4       giro de 360 graus
Escreve:
    marketing/shorts/<nome>.mp4
"""
import argparse
import shutil
import subprocess
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
L, A = 1080, 1920          # vertical, como os três formatos pedem
FPS = 30
# Tudo em gama completa: sem isto as fotos saem brancas e os cartoes
# cinzentos, porque o YUV limitado corta o branco em 235.
BRANCO = "white"
GAMA = ["-color_range", "pc", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"]
SAIDA = ["-pix_fmt", "yuv420p"] + GAMA
TEXTO = "0x111111"

# O ffmpeg trata `:` como separador dentro dos filtros, por isso um caminho
# do Windows (`C:/...`) parte a expressão. Copiar a fonte para junto do
# script evita o problema por completo.
FONTE = AQUI / "fonte.ttf"


def garantir_fonte() -> None:
    if FONTE.exists():
        return
    for candidata in (
        r"C:\Windows\Fonts\arialbd.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ):
        if Path(candidata).exists():
            shutil.copy(candidata, FONTE)
            return
    raise SystemExit("Não encontrei nenhuma fonte utilizável em C:\\Windows\\Fonts.")


def correr(args: list) -> None:
    r = subprocess.run(args, capture_output=True, text=True, cwd=str(AQUI))
    if r.returncode != 0:
        print(" ".join(args[:14]), "...")
        raise SystemExit(r.stderr[-1500:])


def aproximar(zoom: float) -> str:
    """Corta a zona central, para o objeto encher o ecra.

    Tanto as fotos de produto como o giro deixam muito branco a volta. Sem
    cortar, o objeto fica minusculo num telemovel.
    """
    return f"crop=iw*{zoom}:ih*{zoom}:(iw-iw*{zoom})/2:(ih-ih*{zoom})/2"


def texto(conteudo: str, tamanho: int, y: str) -> str:
    seguro = conteudo.replace("'", "").replace(":", "\\:")
    return (
        f"drawtext=fontfile=fonte.ttf:text='{seguro}':"
        f"fontsize={tamanho}:fontcolor={TEXTO}:x=(w-text_w)/2:y={y}"
    )


def cartao(destino: Path, linhas: list, duracao: float) -> None:
    """Um cartão de texto sobre fundo branco."""
    filtros = []
    total = len(linhas)
    for i, (conteudo, tamanho) in enumerate(linhas):
        desvio = (i - (total - 1) / 2) * 130
        filtros.append(texto(conteudo, tamanho, f"(h-text_h)/2+{int(desvio)}"))
    correr([
        "ffmpeg", "-v", "error", "-y",
        "-f", "lavfi", "-i", f"color=c={BRANCO}:s={L}x{A}:d={duracao}:r={FPS}",
        "-vf", "format=rgb24," + ",".join(filtros) + ",setsar=1",
        *SAIDA, str(destino),
    ])


def foto(origem: Path, destino: Path, duracao: float, rotulo: str, zoom: float) -> None:
    """Uma foto de entrada, aproximada e centrada, com rótulo em cima."""
    vf = (
        aproximar(zoom) + ","
        f"scale={L}:{A}:force_original_aspect_ratio=decrease:flags=lanczos,"
        f"format=rgb24,"
        f"pad={L}:{A}:(ow-iw)/2:(oh-ih)/2:{BRANCO},setsar=1,"
        + texto(rotulo, 64, "150")
    )
    correr([
        "ffmpeg", "-v", "error", "-y", "-loop", "1", "-t", str(duracao),
        "-i", str(origem), "-vf", vf, "-r", str(FPS),
        *SAIDA, str(destino),
    ])


def giro(origem: Path, destino: Path, voltas: int, rotulo: str, zoom: float) -> None:
    """O modelo a rodar, repetido, a preencher a largura do ecrã."""
    vf = (
        aproximar(zoom) + ","
        f"scale={L}:{L}:flags=lanczos,"
        f"format=rgb24,"
        f"pad={L}:{A}:0:(oh-ih)/2:{BRANCO},setsar=1,"
        + texto(rotulo, 64, "150")
    )
    correr([
        "ffmpeg", "-v", "error", "-y",
        "-stream_loop", str(voltas - 1), "-i", str(origem),
        "-vf", vf, "-r", str(FPS), *SAIDA, str(destino),
    ])


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--nome", required=True, help="pasta em fotos/ e ficheiro em video/")
    p.add_argument("--legenda", default="", help="nome do objeto, em inglês")
    p.add_argument("--voltas", type=int, default=4)
    p.add_argument("--zoom", type=float, default=0.62,
                   help="fracao central a manter; mais baixo aproxima mais")
    args = p.parse_args()

    garantir_fonte()
    fotos = sorted(
        f for f in (AQUI / "fotos" / args.nome).glob("*")
        if f.suffix.lower() in (".jpg", ".jpeg", ".png")
    )
    turntable = AQUI / "video" / f"{args.nome}.mp4"
    if not fotos:
        raise SystemExit(f"Sem fotos em marketing/fotos/{args.nome}/")
    if not turntable.exists():
        raise SystemExit(f"Falta marketing/video/{args.nome}.mp4")

    tmp = AQUI / "_montagem" / args.nome
    if tmp.exists():
        shutil.rmtree(tmp)
    tmp.mkdir(parents=True)

    pecas = []
    for i, f in enumerate(fotos):
        d = tmp / f"foto{i}.mp4"
        foto(f, d, 0.7, f"{len(fotos)} phone photos", args.zoom)
        pecas.append(d)

    corte = tmp / "corte.mp4"
    cartao(corte, [("minutes later", 86)], 0.8)
    pecas.append(corte)

    rodar = tmp / "giro.mp4"
    giro(turntable, rodar, args.voltas, args.legenda or args.nome, args.zoom)
    pecas.append(rodar)

    fim = tmp / "fim.mp4"
    cartao(fim, [("photos in, 3D model out", 62), ("snap3d.app", 96)], 2.5)
    pecas.append(fim)

    lista = tmp / "lista.txt"
    lista.write_text(
        "\n".join(f"file '{p.as_posix()}'" for p in pecas), encoding="utf-8"
    )

    saida = AQUI / "shorts" / f"{args.nome}.mp4"
    saida.parent.mkdir(exist_ok=True)
    correr([
        "ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0",
        "-i", str(lista), "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(saida),
    ])
    shutil.rmtree(tmp)
    print(f"{saida}  ({saida.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
