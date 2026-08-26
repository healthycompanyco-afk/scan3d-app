# Snap3D — Documentação técnica

Documento de referência e de entrega. Descreve o sistema **tal como está em produção**, as armadilhas conhecidas e o que é preciso para o operar ou transferir.

Última atualização: agosto de 2026 · Produção: https://snap3d.app

---

## 1. O que o produto faz

O utilizador carrega 4 a 6 fotografias de um produto. O sistema gera um modelo 3D fotorrealista e devolve:

- **`.glb`** — malha com textura (visualização web, AR, download)
- **`.ply`** — Gaussian Splatting (vista "realista", com cores e brilho dependentes do ângulo)
- **`.stl`** — geometria para impressão 3D
- **miniatura** `.png` e **cópia da foto de origem** (usadas na galeria pública)
- **widget de incorporação** (`/embed/<id>`) para colar na loja do cliente

Planos: **Explorer** (grátis, 3 modelos/mês, com marca de água), **Creator** (€8/mês, 25 modelos), **Pro** (€20/mês, ilimitado). Os planos pagos não têm marca de água.

---

## 2. Arquitetura

```
Browser
  |
  |-- Vercel ......... frontend Next.js 14 (App Router)   snap3d.app
  |      |
  |      |-- Supabase ... auth, Postgres, Storage         (leitura direta via RLS)
  |      |-- Render ..... API FastAPI                     scan3d-backend-fneq.onrender.com
  |                          |
  |                          |-- Modal .... GPU T4, geração 3D (TRELLIS)
  |                          |-- Stripe ... subscrições e webhooks
  |                          |-- Resend ... emails transacionais
  |
  |-- Supabase Storage ... ficheiros públicos dos modelos
```

**Fluxo de geração:**

1. Frontend cria a linha em `models` (estado `pending`) e envia as fotos para `uploads/`
2. Frontend chama `POST /reconstruct` (com o JWT do Supabase)
3. Backend valida dono + limite do plano, marca `processing` e chama o endpoint do Modal
4. Modal corre o TRELLIS na GPU, escreve os ficheiros em `models/` e atualiza a linha para `done`
5. Modal chama `POST /notify-model-ready`; o backend envia o email "modelo pronto"
6. A página do modelo faz polling de 30 em 30 segundos até `done`

---

## 3. Repositório

```
backend/           API FastAPI (deploy no Render, rootDir=backend)
  main.py            endpoints e CORS
  auth.py            valida o JWT do Supabase -> user_id
  plans.py           limites por plano e reset mensal automático
  stripe_checkout.py sessões de checkout e portal do cliente
  stripe_webhook.py  eventos de subscrição -> atualiza o plano
  emails.py          envio via Resend
  modal_runner.py    dispara o job no Modal
  supabase_utils.py  cliente Supabase (service key)

processing/        jobs do Modal (deploy manual, ver seccao 7)
  trellis_job.py     ATIVO — geração 3D
  triposr_job.py     obsoleto (fallback antigo)
  colmap_job.py      obsoleto (fotogrametria abandonada)

frontend/          Next.js (deploy no Vercel, rootDir=frontend)
  src/app/           páginas: landing, login, dashboard, upload, model, embed,
                     pricing, terms, privacy, auth/callback
  src/components/    visualizadores 3D, logótipo, galeria, marca de água...
  src/lib/           i18n (PT/EN), api (fetch autenticado), legal (dados da empresa)
```

---

## 4. Base de dados (Supabase)

### `user_profiles`

| coluna | notas |
|---|---|
| `id` | = `auth.users.id` |
| `plan` | `free` \| `creator` \| `pro` |
| `models_this_month` | contador; reposto automaticamente (ver abaixo) |
| `models_reset_at` | data do último reset mensal |
| `stripe_customer_id` | ligação à Stripe; usado pelo webhook |
| `plan_expires_at` | não utilizado atualmente |
| `welcomed` | evita repetir o email de boas-vindas |
| `lang` | idioma dos emails (`pt`/`en`), gravado quando o utilizador troca de idioma no site |

### `models`

| coluna | notas |
|---|---|
| `status` | `pending` → `processing` → `done` \| `error` |
| `model_url` `splat_url` `stl_url` `obj_url` | ficheiros gerados (`obj_url` já não é preenchido) |
| `thumbnail_url` | render do modelo, fundo branco |
| `source_url` | cópia pública da 1ª foto de entrada (para a galeria) |
| `watermark` | definido no `/reconstruct` conforme o plano |
| `is_public` | alimenta a galeria e o widget de embed |
| `expires_at` | 30 dias (free), 90 (creator), nulo (pro) |
| `input_type` | histórico; hoje é sempre `ai_single` |

### Políticas RLS (essenciais)

- `auth.uid() = user_id` — cada utilizador só vê/edita o que é seu
- **`public_models_readable`** — permite leitura anónima de `is_public = true AND status = 'done'`

⚠️ Sem a segunda política, **o widget de embed não funciona para os clientes finais** e a galeria fica vazia. Foi um bug real em produção.

### Tarefas agendadas

O reset mensal do contador é feito **em código** (`plans.py`, ao verificar o limite), não por cron. O ficheiro `supabase_cron.sql` contém um cron opcional para apagar modelos expirados.

---

## 5. Variáveis de ambiente

### Render (backend)

| variável | para quê |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | acesso total à BD (service role) |
| `FRONTEND_URL` | CORS e links nos emails/checkout (`https://snap3d.app`) |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` do endpoint **em produção** |
| `STRIPE_PRICE_CREATOR`, `STRIPE_PRICE_PRO` | IDs de preço **live** (obrigatórios, sem valor por omissão) |
| `MODAL_TRELLIS_URL` | endpoint do job de geração |
| `RESEND_API_KEY`, `EMAIL_FROM` | emails (`Snap3D <ola@snap3d.app>`) |
| `SENTRY_DSN` | monitorização de erros (opcional) |
| `PYTHON_VERSION` | `3.11.9` |

Obsoletas, podem ser removidas: `MODAL_ENDPOINT_URL`, `MODAL_TRIPOSR_URL`.

### Vercel (frontend)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BACKEND_URL`

### Modal (secrets)

`supabase-url`, `supabase-service-key` — criados no painel do Modal, não em ficheiro.

---

## 6. Diagnóstico rápido

```
GET https://scan3d-backend-fneq.onrender.com/health
-> {"status":"ok","stripe_sdk":"15.5.1","sentry":true,"emails":true}
```

Confirma num só pedido se o serviço está de pé, que versão do SDK da Stripe corre e se a monitorização e os emails estão configurados.

---

## 7. Deploy

**Frontend e backend:** automático a cada push para `main` (Vercel e Render).

**Modal (geração 3D):** manual, a partir de um computador com o CLI autenticado.

```bash
cd processing
python -m modal deploy trellis_job.py
```

Alterações só ao código da função levam segundos. Alterações à **imagem** (dependências) obrigam a reconstruir tudo — 6 a 10 minutos, e é aí que costuma partir (ver secção 8).

---

## 8. Armadilhas conhecidas (ler antes de mexer)

### Build do TRELLIS — frágil

A imagem do Modal levou várias tentativas a compilar. Cada uma destas linhas existe por um motivo:

- **Imagem base CUDA `devel`** (não `runtime`): as extensões precisam do `nvcc`
- **`CC=gcc` / `CXX=g++`**: a imagem define `CXX=clang++`, que não está instalado → o CMake falha
- **`cmake==3.31.6`**: o CMake 4.x rejeita os `CMakeLists.txt` destes projetos
- **`numpy==1.26.4` instalado no fim**: o `kaolin` exige `numpy<2`, mas o `utils3d` volta a subir para 2.x. Com numpy 2.x o kaolin rebenta com *"numpy.dtype size changed"*
- **`huggingface_hub==0.17.3` + `tokenizers==0.14.1`**: versões novas quebram o `transformers 4.35`
- **`--no-build-isolation`** nas extensões CUDA: sem isto não encontram o PyTorch instalado
- **`open3d`**: não é usado diretamente, mas o `__init__` do TRELLIS importa-o

### Stripe

- O SDK está **fixado** (`stripe>=15.5,<16`). Um salto de major já partiu os pagamentos: o `StripeObject` deixou de ter `.get()` e o webhook passou a devolver 500 — clientes pagavam e ficavam no plano grátis. **Usar sempre acesso por chave (`obj["campo"]`), nunca `.get()`**
- Os IDs de preço de teste e de produção são **diferentes**. Estão em variáveis de ambiente, sem valor por omissão, de propósito
- O portal do cliente tem de ser ativado **em cada modo** (teste e produção) separadamente
- Um reembolso **não** cancela a subscrição nem revoga o acesso; é operação manual
- Os preços são **multi-moeda no mesmo `price_id`** (`currency_options`: EUR e USD).
  O site escolhe pela língua — inglês cobra em dólares, português em euros — e o
  webhook continua a reconhecer o plano pelo mesmo ID. Ao criar um preço novo,
  **definir as duas moedas**; se faltar, o checkout cai para euros e regista o erro

### Base de dados

A coluna `models.expires_at` **tem de aceitar nulos**. O backend escreve `NULL`
para o plano Pro ("nunca expira"), e durante algum tempo a coluna esteve
`NOT NULL` em produção — qualquer geração de um cliente Pro teria falhado.
Corrigido em agosto de 2026, antes de existir o primeiro cliente Pro.

A coluna `gallery` é **diferente** de `is_public`. `is_public` faz o link e o
widget de embed funcionarem para quem não tem conta; `gallery` é curadoria
manual do que aparece na página inicial. Manter separadas: os modelos gerados
para prospetos são públicos mas usam fotos das lojas dos prospetos e não podem
aparecer no site.

### Emails

São **dois sistemas**: o Supabase envia confirmação de conta e recuperação de password (SMTP personalizado apontado ao Resend); o backend envia boas-vindas e "modelo pronto". Mudar de fornecedor implica mexer nos dois sítios.

Os emails do **backend** seguem a coluna `lang` do perfil (PT/EN). Os do **Supabase** usam um único template, definido no painel — não são por utilizador.

### Qualidade dos modelos

Funciona bem com objetos **sólidos, foscos, fundo simples**. Falha sistematicamente com **vidro, metal polido, joalharia e objetos com detalhe muito fino** — é limitação do modelo, não configuração.

---

## 9. Custos operacionais

| serviço | plano atual | notas |
|---|---|---|
| Modal | pré-pago | ~€0,05–0,15 por modelo (GPU T4) |
| Render | grátis | adormece após inatividade: ~50 s no primeiro pedido. Starter $7/mês resolve |
| Vercel, Supabase, Resend, Sentry | grátis | dentro dos limites atuais |
| Cloudflare | ~€12/ano | registo do domínio |
| Stripe | por transação | ~1,5% + €0,25 (cartões UE) |

Margem: Creator €8 ≈ €6,50 líquidos; Pro €20 ≈ €12–17.

---

## 10. Contas a transferir

Domínio (Cloudflare), Vercel, Render, Supabase, Modal, Stripe, Resend, Sentry, Google Cloud (OAuth) e o repositório GitHub. Todas registadas em nome do proprietário atual.

⚠️ Ao transferir: as chaves da Stripe e do Supabase têm de ser **rodadas**, e o `STRIPE_WEBHOOK_SECRET` recriado com o novo endpoint.

---

## 11. Licenças

- **TRELLIS** (Microsoft) — MIT, uso comercial livre, sem restrições geográficas
- Alternativa avaliada: **Hunyuan3D-2** (Tencent) é mais recente, mas a licença **exclui expressamente a União Europeia, o Reino Unido e a Coreia do Sul**, incluindo os resultados gerados. Não utilizável por uma entidade europeia
- As fotos de demonstração da galeria vêm do *Google Scanned Objects* (CC BY 4.0, exige atribuição). Substituí-las por fotografias próprias elimina essa obrigação
