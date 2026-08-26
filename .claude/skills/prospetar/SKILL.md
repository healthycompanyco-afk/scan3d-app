---
name: prospetar
description: Angariação de clientes para o Snap3D — encontra lojas nos nichos certos, avalia se o produto dá bom modelo 3D, gera o modelo e prepara a mensagem para o Pedro rever e enviar. Usar quando o pedido for arranjar clientes, prospetar, contactar lojas ou preparar abordagens.
---

# Prospeção do Snap3D

O objetivo de cada ciclo: entregar ao Pedro **um prospeto pronto a contactar** —
loja identificada, modelo 3D já gerado a partir dos produtos dela, e mensagem
escrita. Ele revê e envia.

**Nunca envies mensagens.** Não uses email, Instagram, formulários de contacto
nem qualquer outro canal. O teu trabalho acaba na fila de revisão. Isto é uma
regra do produto, não uma limitação técnica: envio automatizado em massa queima
a conta de Instagram, levanta problemas de RGPD com artesãos em nome individual,
e destrói exatamente aquilo que faz a abordagem funcionar.

A ferramenta está em `prospecting/snap3d_prospect.py`. Corre sempre a partir
dessa pasta.

## Nichos

Só estes três: **artesanato**, **vestuário e calçado**, **mobiliário e decoração**.

Joalharia está **excluída**. O TRELLIS falha com metal polido e pedras, e um
prospeto desiludido custa mais do que vale. Se o Pedro pedir um joalheiro,
lembra-lhe porquê antes de avançar.

## Ciclo

### 1. Encontrar candidatos

Se o Pedro der um URL, salta para o passo 2. Caso contrário procura, e procura
como quem procura um cliente, não como quem enche uma lista.

- Portugal: pesquisa por loja online + nicho (`cerâmica artesanal Portugal loja online`,
  `mobiliário artesanal comprar`), e por Instagram (`#artesanatoportugues`)
- Internacional: lojas Shopify e Etsy nos mesmos nichos

Uma loja só é candidata se cumprir tudo isto:

- **Vende online** — tem loja própria ou Etsy, não é só uma página de portefólio
- **Tem várias fotos por produto**, de ângulos diferentes. Sem isto não há modelo.
- **Vende objetos, não serviços nem comida**
- **É pequena ou média.** Uma marca grande já tem quem lhe faça 3D e a decisão
  demora meses. O alvo é quem decide sozinho.
- **Tem contacto visível** — Instagram, email ou formulário

Verifica no registo (`python snap3d_prospect.py lista`) que ainda não foi
contactada. Nunca repitas uma loja.

### 2. Escolher o produto

Escolhe **um** produto da loja. É a decisão mais importante do ciclo, porque
determina se a demonstração impressiona ou desilude.

Bons: cerâmica, madeira, têxtil, couro, calçado, cestaria, velas, cadeiras,
candeeiros de tecido, brinquedos, peças pintadas à mão.

Maus: qualquer coisa com metal polido, vidro, espelhos, superfícies muito
brilhantes, detalhe muito fino, transparências, ou objetos fotografados sobre
uma pessoa.

Prefere um produto **em destaque na loja** — o mais vendido ou o da homepage.
Ver o seu produto principal a rodar tem mais efeito que ver um obscuro.

### 3. Extrair as fotos

```
python snap3d_prospect.py fotos <url-do-produto>
```

Depois **abre as fotos guardadas e olha para elas** (lê os ficheiros da pasta
`prospecting/trabalho/<slug>/`). Confirma, uma a uma:

- São todas do **mesmo objeto**? Apaga fotos de outros produtos, de banners,
  de ambiente e de modelos humanos.
- São de **ângulos diferentes**? Cinco fotos do mesmo ângulo valem uma.
- O objeto **preenche a imagem** e o fundo é simples?
- Há **brilho ou reflexos fortes**? Se sim, este produto não serve — escolhe outro
  da mesma loja, ou abandona a loja.

Ficar com 4 boas é melhor que ficar com 6, das quais 2 são lixo. Apaga sem pena.

Se não sobrarem 4 fotos aproveitáveis, **diz isso ao Pedro e passa à loja
seguinte**. Não gastes GPU num modelo que já sabes que vai sair mal.

### 4. Registar e gerar

```
python snap3d_prospect.py registar --slug <slug> --loja "Nome" --url <loja> --nicho artesanato --contacto "@instagram"
python snap3d_prospect.py gerar --slug <slug> --nome "Nome do produto"
```

Demora 5-10 minutos. Entretanto avança para outro prospeto ou escreve a mensagem.
Confirma no fim com `python snap3d_prospect.py estado`.

Se o estado ficar `ERRO`, lê a mensagem, diz ao Pedro o que aconteceu e não
tentes outra vez com as mesmas fotos.

### 5. Escrever a mensagem

Os guiões-base estão em `MARKETING.md`. **Adapta-os, não os copies.** A mensagem
tem de provar que alguém olhou mesmo para aquela loja.

Regras:

- **Curta.** Instagram: quatro linhas. Email: seis.
- **Uma frase específica sobre a loja**, verdadeira e concreta. "Vi as vossas
  travessas de barro preto" — não "adorei o vosso trabalho incrível".
- **O link cedo.** É o único objetivo da primeira mensagem.
- **Sem preço.** Só se perguntarem.
- **Sem palavras de vendedor**: nada de "solução", "revolucionar", "potenciar",
  "no mundo digital de hoje".
- **Idioma da loja.** Português de Portugal para lojas portuguesas — sem
  português do Brasil.
- Assina como Pedro, com snap3d.app.

Escreve **duas versões** quando o contacto for por Instagram e email ambos, para
ele escolher.

### 6. Entregar para revisão

Apresenta ao Pedro, por prospeto:

1. Loja, nicho e porque a escolheste (uma linha)
2. Onde contactar
3. Link do modelo — e diz-lhe para **o abrir antes de enviar**
4. A mensagem, pronta a copiar
5. Qualquer reserva que tenhas sobre a qualidade do modelo

Diz-lhe sempre para ver o modelo primeiro. Se saiu mau, enviar é pior que não
enviar nada.

Depois de ele enviar:

```
python snap3d_prospect.py enviado --slug <slug> --canal instagram
```

E quando houver desfecho:

```
python snap3d_prospect.py resposta --slug <slug> --resultado interessado
```

## Ritmo

Cinco por dia, no máximo, e de nichos variados nas primeiras semanas — é assim
que se descobre qual responde. Vinte mensagens iguais no mesmo dia é spam, e
nota-se.

Cada modelo custa 0,05-0,15 € de GPU. O desperdício não é o dinheiro, é enviar
uma demonstração má.

## Ao fim de cada semana

Corre `python snap3d_prospect.py lista` e diz ao Pedro, em números: quantos
contactados, quantos responderam, por nicho e por canal. Se um nicho estiver
claramente à frente ao fim de 25 contactos, recomenda que se concentre nele.
