# Agente de prospeção

Automatiza o trabalho mecânico de arranjar clientes para o Snap3D: encontrar
lojas nos nichos certos, avaliar se o produto dá bom modelo, extrair as fotos,
gerar o modelo 3D e escrever a mensagem.

**Não envia mensagens.** A fila fica pronta, tu revês e envias.

## Porque é que o envio não é automático

Não é timidez técnica. São três razões concretas:

**Instagram.** Automatizar mensagens diretas viola os termos de utilização. O
resultado habitual é a conta bloqueada — e o Instagram é o melhor canal que tens
para o mercado português.

**RGPD.** Muitos artesãos são empresários em nome individual, ou seja *pessoas
singulares*. Em Portugal a Lei 41/2004 exige consentimento prévio para lhes
enviar comunicações comerciais não solicitadas. Cinco emails escritos e enviados
por ti é uma coisa; quinhentos disparados por um programa é outra, e a empresa
é europeia.

**Eficácia.** O que faz esta abordagem funcionar é ser evidente que alguém olhou
mesmo para aquela loja e escolheu aquele produto. Isso não sobrevive à escala.
Ver `MARKETING.md`.

## Instalação

Só precisa de `httpx`, que já tens do backend.

```bash
cd prospecting
cp .env.example .env
python snap3d_prospect.py quem-sou --email o-teu@email.pt
```

Cola o `SNAP3D_USER_ID` no `.env`, e copia o `MODAL_TRELLIS_URL` do painel do
Render para lá também. As credenciais do Supabase são lidas de `backend/.env`.

**Antes da primeira utilização**, corre `migracao_gallery.sql` no Supabase. Sem
isso, os modelos que gerares para prospetos aparecem na galeria da página
inicial do snap3d.app — com fotos das lojas deles.

## Utilização

O normal é pedires ao Claude Code, na pasta do projeto:

> prospeta três lojas de cerâmica em Portugal

A skill `prospetar` (em `.claude/skills/prospetar/`) trata do ciclo todo e
entrega-te a fila para reveres.

À mão, se preferires:

```bash
python snap3d_prospect.py fotos "https://loja.pt/products/jarra-preta"
# ver as fotos em trabalho/<slug>/ e apagar as que não servem
python snap3d_prospect.py registar --slug jarra-preta --loja "Olaria X" --nicho artesanato --contacto "@olariax"
python snap3d_prospect.py gerar --slug jarra-preta --nome "Jarra de barro preto"
python snap3d_prospect.py estado
# enviar a mensagem tu
python snap3d_prospect.py enviado --slug jarra-preta --canal instagram
python snap3d_prospect.py resposta --slug jarra-preta --resultado interessado
```

## Como os modelos de prospeto são criados

Diferente do fluxo normal do site, de propósito:

| campo | valor | porquê |
|---|---|---|
| `is_public` | `true` | o destinatário abre o link sem ter conta |
| `gallery` | `false` | não vai para a homepage — as fotos são da loja dele |
| `watermark` | `true` | a marca de água é a publicidade |
| `expires_at` | `NULL` | um link oferecido não pode morrer daqui a 30 dias |

A GPU é chamada diretamente, sem passar pelo `/reconstruct`, para não gastar
quota da tua conta. Custo: 0,05-0,15 € por modelo.

## Limites do extrator de fotos

- **Lojas Shopify**: usa o endpoint oficial do produto, traz só as fotos daquele
  artigo. É o melhor caso.
- **Outras lojas**: raspa o HTML e apanha banners e produtos relacionados à
  mistura. Tens sempre de olhar para as fotos e apagar as que não servem.
- **Lojas que carregam as imagens por JavaScript** (Etsy incluída, muitas vezes):
  não funciona. Guarda as fotos à mão em `trabalho/<slug>/`.
- Se o produto tiver sido removido, a loja redireciona para a coleção e o
  extrator avisa. Não ignores esse aviso.

## Sobre as fotos das lojas

Descarregar fotografias de um produto para gerar um modelo que se oferece ao
próprio dono é defensável. Fazê-lo em massa, ou publicar essas fotos no teu
site, já não é — daí o `gallery = false`.

Se alguém pedir para apagar o modelo, apaga e não discutas. Guarda o pedido.

## Ficheiros

```
snap3d_prospect.py   a ferramenta
prospetos.json       registo local de quem foi contactado (não vai para o git)
trabalho/<slug>/     fotos descarregadas (não vai para o git)
.env                 SNAP3D_USER_ID e MODAL_TRELLIS_URL
```
