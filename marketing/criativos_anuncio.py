"""
Criativos pagos do Snap3D: vídeo curto e imagem estática, nos formatos
que o Meta, o YouTube e a Rede de Display do Google pedem.

Diferente do vídeo orgânico (`montar_short.py`): um anúncio tem de parar o
polegar no primeiro segundo, por isso começa já com o modelo a rodar em vez
da sequência de fotos.

    0,0 s   modelo a rodar          "From 5 phone photos"
    2,5 s   as fotos, muito rápidas
    4,0 s   modelo a rodar          "Your customer can spin it"
    9,0 s   cartão final            "3 free models · snap3d.app"

Como usar:

    python criativos_anuncio.py --nome leao --legenda "Toy lion"

Produz em marketing/anuncios/:
    <nome>_9x16.mp4   Reels, Stories, Shorts
    <nome>_1x1.mp4    feed do Instagram e Facebook
    <nome>_16x9.mp4   YouTube
    <nome>_1x1.jpg    imagem estática, feed
    <nome>_191x1.jpg  imagem estática, Display e feed largo
"""
import argparse
import shutil
import subprocess
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
FPS = 30
BRANCO = "white"
TEXTO = "0x111111"
MARCA = "0x2563eb"
FONTE = AQUI / "fonte.ttf"

FORMATOS = {"9x16": (1080, 1920), "1x1": (1080, 1080), "16x9": (1920, 1080)}

# Gama completa em todos os segmentos: sem isto o branco das fotos e o branco
# dos cartoes nao coincidem e veem-se faixas cinzentas no video final.
SAIDA = ["-pix_fmt", "yuv420p", "-color_range", "pc",
         "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"]


def cabe(conteudo: str, largura: int, maximo: int) -> int:
    """Maior tamanho de letra que deixa a frase caber na largura.

    Uma bold a 0,55 da altura por caractere e uma aproximacao suficiente;
    sem isto, frases longas saem cortadas nas bordas do formato vertical.
    """
    return max(28, min(maximo, int(largura * 0.92 / (len(conteudo) * 0.55))))


def garantir_fonte() -> None:
    if FONTE.exists():
        return
    for c in (r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\segoeuib.ttf"):
        if Path(c).exists():
            shutil.copy(c, FONTE)
            return
    raise SystemExit("Sem fonte utilizável em C:\\Windows\\Fonts.")


def correr(args: list) -> None:
    r = subprocess.run(args, capture_output=True, text=True, cwd=str(AQUI))
    if r.returncode != 0:
        raise SystemExit(" ".join(str(a) for a in args[:12]) + "\n" + r.stderr[-1500:])


def txt(conteudo: str, tamanho: int, y: str, cor: str = TEXTO) -> str:
    seguro = conteudo.replace("'", "").replace(":", "\\:")
    return (f"drawtext=fontfile=fonte.ttf:text='{seguro}':fontsize={tamanho}"
            f":fontcolor={cor}:x=(w-text_w)/2:y={y}")


def recorte(zoom: float) -> str:
    return f"crop=iw*{zoom}:ih*{zoom}:(iw-iw*{zoom})/2:(ih-ih*{zoom})/2"


def encaixar(l: int, a: int) -> str:
    """Escala mantendo proporção e preenche o resto de branco, em RGB."""
    return (f"scale={l}:{a}:force_original_aspect_ratio=decrease:flags=lanczos,"
            f"format=rgb24,pad={l}:{a}:(ow-iw)/2:(oh-ih)/2:{BRANCO},setsar=1")


# ---------------------------------------------------------------- vídeo
def seg_giro(origem: Path, destino: Path, voltas: int, rotulo: str,
             l: int, a: int, zoom: float) -> None:
    correr(["ffmpeg", "-v", "error", "-y", "-stream_loop", str(voltas - 1),
            "-i", str(origem),
            "-vf", recorte(zoom) + "," + encaixar(l, a) + "," + txt(rotulo, cabe(rotulo, l, int(a * 0.05)), f"{int(a*0.07)}"),
            "-r", str(FPS), *SAIDA, str(destino)])


def seg_foto(origem: Path, destino: Path, dur: float, l: int, a: int, zoom: float) -> None:
    correr(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-t", str(dur),
            "-i", str(origem), "-vf", recorte(zoom) + "," + encaixar(l, a),
            "-r", str(FPS), *SAIDA, str(destino)])


def seg_cartao(destino: Path, linhas: list, dur: float, l: int, a: int) -> None:
    filtros = ["format=rgb24"]
    for i, (conteudo, tam, cor) in enumerate(linhas):
        desvio = (i - (len(linhas) - 1) / 2) * int(a * 0.09)
        filtros.append(txt(conteudo, tam, f"(h-text_h)/2+{int(desvio)}", cor))
    correr(["ffmpeg", "-v", "error", "-y", "-f", "lavfi",
            "-i", f"color=c={BRANCO}:s={l}x{a}:d={dur}:r={FPS}",
            "-vf", ",".join(filtros) + ",setsar=1", *SAIDA, str(destino)])


def montar_video(nome: str, legenda: str, fotos: list, giro: Path,
                 formato: str, zoom: float) -> Path:
    l, a = FORMATOS[formato]
    tmp = AQUI / "_anuncio" / f"{nome}_{formato}"
    if tmp.exists():
        shutil.rmtree(tmp)
    tmp.mkdir(parents=True)
    pecas = []

    p = tmp / "giro1.mp4"
    seg_giro(giro, p, 1, "From 5 phone photos", l, a, zoom)
    pecas.append(p)

    for i, f in enumerate(fotos):          # rajada rápida das fotos
        p = tmp / f"f{i}.mp4"
        seg_foto(f, p, 0.3, l, a, zoom)
        pecas.append(p)

    p = tmp / "giro2.mp4"
    seg_giro(giro, p, 2, "Your customer can spin it", l, a, zoom)
    pecas.append(p)

    p = tmp / "fim.mp4"
    seg_cartao(p, [("3 free models, no card", int(a * 0.038), TEXTO),
                   ("snap3d.app", int(a * 0.062), MARCA)], 2.2, l, a)
    pecas.append(p)

    lista = tmp / "lista.txt"
    lista.write_text("\n".join(f"file '{x.as_posix()}'" for x in pecas), encoding="utf-8")
    saida = AQUI / "anuncios" / f"{nome}_{formato}.mp4"
    saida.parent.mkdir(exist_ok=True)
    correr(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0",
            "-i", str(lista), "-c:v", "libx264", "-preset", "medium", "-crf", "20",
            *SAIDA, "-movflags", "+faststart", str(saida)])
    shutil.rmtree(tmp)
    return saida


# ---------------------------------------------------------------- imagem
def montar_imagem(nome: str, fotos: list, giro: Path, l: int, a: int,
                  sufixo: str, zoom: float) -> Path:
    """Quatro ângulos do mesmo objeto, lado a lado.

    Uma imagem parada nunca ganha a uma fotografia de produto: o render sai
    sempre mais liso. O que vende não é a fidelidade de um fotograma, é o
    objeto rodar — e num formato estático isso mostra-se com a sequência
    de ângulos, não com um "antes e depois" que convida à comparação errada.
    """
    tmp = AQUI / "_anuncio" / f"img_{nome}_{sufixo}"
    if tmp.exists():
        shutil.rmtree(tmp)
    tmp.mkdir(parents=True)

    topo = int(a * 0.17)        # faixa do título
    base = int(a * 0.16)        # faixa da marca
    faixa = a - topo - base
    colunas = 4 if l > a * 1.3 else 2
    linhas_n = 1 if colunas == 4 else 2
    cl, ca = l // colunas, faixa // linhas_n

    partes = []
    for k, n in enumerate((0, 15, 30, 45)):
        d = tmp / f"a{k}.png"
        correr(["ffmpeg", "-v", "error", "-y", "-i", str(giro),
                "-vf", (f"select=eq(n\,{n}),{recorte(zoom)},"
                        f"{encaixar(int(cl * 0.86), int(ca * 0.86))},"
                        f"pad={cl}:{ca}:(ow-iw)/2:(oh-ih)/2:{BRANCO}"),
                "-frames:v", "1", str(d)])
        partes.append(d)

    grelha = tmp / "grelha.png"
    if colunas == 4:
        filtro = "[0:v][1:v][2:v][3:v]hstack=inputs=4,format=rgb24[o]"
    else:
        filtro = ("[0:v][1:v]hstack=inputs=2[t];[2:v][3:v]hstack=inputs=2[b];"
                  "[t][b]vstack=inputs=2,format=rgb24[o]")
    correr(["ffmpeg", "-v", "error", "-y",
            *sum([["-i", str(x)] for x in partes], []),
            "-filter_complex", filtro, "-map", "[o]", "-frames:v", "1", str(grelha)])

    saida = AQUI / "anuncios" / f"{nome}_{sufixo}.jpg"
    saida.parent.mkdir(exist_ok=True)
    correr(["ffmpeg", "-v", "error", "-y", "-i", str(grelha),
            "-vf",
            f"pad={l}:{a}:0:{topo}:{BRANCO},format=rgb24,"
            + txt("One upload. Every angle.", int(a * 0.072), f"{int(topo*0.33)}") + ","
            + txt("3 free models  .  snap3d.app", int(a * 0.055), f"h-{int(base*0.62)}", MARCA),
            "-frames:v", "1", "-q:v", "2", str(saida)])
    shutil.rmtree(tmp)
    return saida


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--nome", required=True)
    p.add_argument("--legenda", default="")
    p.add_argument("--zoom", type=float, default=0.62)
    args = p.parse_args()

    garantir_fonte()
    fotos = sorted(f for f in (AQUI / "fotos" / args.nome).glob("*")
                   if f.suffix.lower() in (".jpg", ".jpeg", ".png"))
    giro = AQUI / "video" / f"{args.nome}.mp4"
    if not fotos or not giro.exists():
        raise SystemExit("Faltam as fotos ou o giro deste objeto.")

    for formato in FORMATOS:
        s = montar_video(args.nome, args.legenda, fotos, giro, formato, args.zoom)
        print(f"  {s.name:<22}{s.stat().st_size // 1024} KB")
    for l, a, sufixo in ((1080, 1080, "1x1"), (1200, 628, "191x1")):
        s = montar_imagem(args.nome, fotos, giro, l, a, sufixo, args.zoom)
        print(f"  {s.name:<22}{s.stat().st_size // 1024} KB")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
