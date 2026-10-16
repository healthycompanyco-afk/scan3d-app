# Campanha Google Pesquisa — tudo pronto a colar

Orçamento: **5 €/dia** · Limite total do teste: **150 €** · Duração: ~3 semanas

Segue por ordem. Onde está `COPIAR`, é mesmo copiar e colar.

---

## Antes de começar

- [ ] **Render no plano Starter (7 $/mês).** Em grátis, o backend adormece e a
      primeira geração demora ~50 s. Não vale a pena pagar cliques para mandar
      pessoas a um site que parece avariado.
- [ ] Abrir [snap3d.app/?lang=en](https://snap3d.app/?lang=en) numa janela
      anónima e confirmar que abre **em inglês**.

---

## 1. Criar a campanha

[ads.google.com](https://ads.google.com) → **+ Nova campanha**

- Objetivo: **Criar uma campanha sem um objetivo**
  *(escolher "Vendas" obriga a lances automáticos, que precisam de conversões
  que ainda não tens)*
- Tipo: **Pesquisa**
- Desmarcar **Rede de Display** e **Parceiros de pesquisa**

## 2. Lances e orçamento

| campo | valor |
|---|---|
| Orçamento diário | `5` € |
| Estratégia de lances | **CPC manual** |
| Lance máximo | `0,50` € |

## 3. Localizações e idioma

- Localizações: **Estados Unidos, Reino Unido, Canadá, Austrália**
- **Opções de localização → "Presença: pessoas que estão ou visitam
  regularmente"**
  ⚠️ A predefinição inclui "ou com interesse em" e gasta metade do orçamento
  em quem está noutro continente. Mudar isto é obrigatório.
- Idioma: **Inglês**

## 4. Palavras-chave — correspondência de frase

COPIAR:

```
"photo to 3d model"
"3d model from photos"
"turn photos into 3d model"
"product 3d model for shopify"
"3d product viewer"
"image to 3d model"
```

## 5. Palavras-chave negativas

É aqui que os orçamentos pequenos morrem. Sem isto, metade vai para
estudantes à procura de tutoriais.

COPIAR:

```
free
gratis
blender
tutorial
course
how to
reddit
github
python
unity
unreal
printing
printer
stl
job
jobs
salary
anime
character
generator
```

## 6. O anúncio

**URL final** — COPIAR:

```
https://snap3d.app/?lang=en&utm_source=google&utm_medium=cpc&utm_campaign=search_en
```

**Títulos** (o Google combina-os sozinho) — COPIAR um por linha:

```
Turn Product Photos Into 3D
3D Models From 4 Photos
Let Shoppers Spin Your Product
3 Free Models, No Card
Works With Shopify
Photos In, 3D Model Out
```

**Descrições** — COPIAR:

```
Upload 4-6 photos of your product. Get a 3D model you can embed on your product page.
No 3D skills needed. Ceramics, shoes, furniture, textiles. From $9/month.
```

---

## Calendário

| quando | o quê |
|---|---|
| **Dia 3** | Ver **Termos de pesquisa**. Acrescentar como negativa tudo o que não é um comprador |
| **Dia 7** | Correr a consulta abaixo. 0 registos em ~50 cliques já é mau sinal |
| **Dia 21** ou aos 150 € | **Parar e decidir** |

Consulta de resultados, no SQL Editor do Supabase:

```sql
SELECT COALESCE(utm_source, 'direto') AS origem,
       COALESCE(utm_campaign, '-')    AS campanha,
       COUNT(*)                       AS registos,
       COUNT(*) FILTER (WHERE plan <> 'free') AS pagantes
FROM user_profiles
GROUP BY 1, 2
ORDER BY registos DESC;
```

## Regras de paragem — definidas antes de gastar

- **0 registos ao fim de 150 cliques** → parar. O problema é a página ou a
  oferta, não o orçamento.
- **Registos mas 0 pagantes ao fim de 300 cliques** → parar. O problema é o
  produto ou o preço.
- **Custo por pagante abaixo de 50 €** → encontraste um canal. Aumentar.

A tentação, quando os números forem maus, vai ser dar "mais um bocadinho".
É por isso que as regras ficam escritas antes.
