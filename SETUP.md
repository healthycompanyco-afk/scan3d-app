# Scan3D — Guia de Setup Completo

## Pré-requisitos
- [Node.js 20+](https://nodejs.org) instalado
- [Python 3.11+](https://python.org) instalado
- Conta GitHub (para fazer deploy)

---

## Passo 1 — Criar contas gratuitas

### Supabase (base de dados + auth + storage)
1. Vai a https://supabase.com e cria conta
2. Clica "New project" → dá um nome → escolhe região Europa
3. Guarda a **Project URL** e as duas chaves: `anon key` e `service_role key`

### Modal.com (processamento 3D com GPU)
1. Vai a https://modal.com e cria conta
2. Instala o CLI: `pip install modal`
3. Autentica: `modal token new` (abre o browser automaticamente)

### Vercel (frontend)
1. Vai a https://vercel.com e cria conta com GitHub
2. Vais fazer deploy mais tarde

### Render (backend)
1. Vai a https://render.com e cria conta com GitHub

### Stripe (pagamentos)
1. Vai a https://stripe.com e cria conta
2. Vai a Developers → API Keys → copia a `publishable key` e a `secret key`

---

## Passo 2 — Configurar o Supabase

### 2.1 Criar as tabelas
1. No painel Supabase, vai a **SQL Editor**
2. Cola o conteúdo do ficheiro `supabase_schema.sql`
3. Clica "Run"

### 2.2 Criar os buckets de storage
1. Vai a **Storage** → "New bucket"
2. Cria bucket `uploads` → **privado** (Private)
3. Cria bucket `models` → **público** (Public)

### 2.3 Ativar autenticação por email
1. Vai a **Authentication** → Providers → Email → Enable
2. (Opcional) Ativa também Google OAuth para login com Google

---

## Passo 3 — Configurar o frontend

```bash
cd foto3d-app/frontend

# Instalar dependências
npm install

# Copiar ficheiro de variáveis de ambiente
cp .env.local.example .env.local
```

Abre `.env.local` e preenche:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co       # do painel Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                    # anon key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000            # muda depois do deploy
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...          # do painel Stripe
```

Testar localmente:
```bash
npm run dev
# Abre http://localhost:3000
```

---

## Passo 4 — Configurar o backend

```bash
cd foto3d-app/backend

# Criar ambiente virtual Python
python -m venv venv
venv\Scripts\activate        # Windows
# ou: source venv/bin/activate  (Mac/Linux)

# Instalar dependências
pip install -r requirements.txt

# Copiar ficheiro de variáveis de ambiente
cp .env.example .env
```

Abre `.env` e preenche com as chaves do Supabase e Stripe.

Testar localmente:
```bash
uvicorn main:app --reload
# API disponível em http://localhost:8000
# Documentação em http://localhost:8000/docs
```

---

## Passo 5 — Configurar o processamento Modal.com

```bash
cd foto3d-app/processing

# Criar segredos no Modal (uma vez só)
modal secret create supabase-url SUPABASE_URL=https://xxxx.supabase.co
modal secret create supabase-service-key SUPABASE_SERVICE_KEY=eyJ...

# Fazer deploy da função de processamento
modal deploy colmap_job.py
```

Testar o processamento (opcional, consome crédito):
```bash
modal run colmap_job.py::reconstruct --model-id "test-uuid" --user-id "test-uuid" --input-type "photos"
```

---

## Passo 6 — Deploy para produção

### 6.1 Deploy do frontend no Vercel
1. Faz push do projeto para GitHub
2. Vai a https://vercel.com → "Import Project" → seleciona o repositório
3. Define a **Root Directory** como `frontend`
4. Adiciona as variáveis de ambiente (as mesmas do `.env.local`)
5. Clica "Deploy"
6. Copia o URL do Vercel (ex: `https://scan3d.vercel.app`)

### 6.2 Deploy do backend no Render
1. Vai a https://render.com → "New Web Service"
2. Conecta o repositório GitHub
3. Configura:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Adiciona as variáveis de ambiente (as mesmas do `.env`)
5. Clica "Create Web Service"
6. Copia o URL do Render (ex: `https://scan3d-api.onrender.com`)

### 6.3 Atualizar URLs
- No Vercel: atualiza `NEXT_PUBLIC_BACKEND_URL` com o URL do Render
- No Render: adiciona `FRONTEND_URL` com o URL do Vercel (para CORS)

### 6.4 Configurar webhook do Stripe
1. No painel Stripe → Developers → Webhooks → "Add endpoint"
2. URL: `https://scan3d-api.onrender.com/webhook/stripe`
3. Eventos a escutar:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copia o **Webhook signing secret** → adiciona ao Render como `STRIPE_WEBHOOK_SECRET`

---

## Estrutura final do projeto

```
foto3d-app/
├── frontend/          # Next.js — deploy no Vercel
├── backend/           # FastAPI — deploy no Render
├── processing/        # Modal.com — deploy com "modal deploy"
├── supabase_schema.sql
└── SETUP.md           # este ficheiro
```

---

## Resolução de problemas comuns

| Problema | Causa provável | Solução |
|---|---|---|
| Login não funciona | Supabase URL/key errada | Verificar `.env.local` |
| Upload falha | Bucket não criado | Criar buckets `uploads` e `models` no Supabase |
| Processamento não inicia | Modal não autenticado | Correr `modal token new` |
| Backend não responde | Render a dormir | Aguardar 30-60 segundos (cold start) |
| Modelo com erro | Fotos com má qualidade | Usar mais luz, fundo simples, mais sobreposição |
