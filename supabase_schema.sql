-- ============================================================
-- Snap3D — Esquema da base de dados (Supabase / Postgres)
-- Reflete o estado em produção em agosto de 2026.
-- Para uma instalação nova: colar tudo no SQL Editor.
-- ============================================================

-- ------------------------------------------------------------
-- Perfil do utilizador
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan                TEXT NOT NULL DEFAULT 'free',   -- free | creator | pro
    models_this_month   INT  NOT NULL DEFAULT 0,
    models_reset_at     TIMESTAMPTZ,                    -- último reset mensal (feito em código)
    stripe_customer_id  TEXT,                           -- ligação à Stripe (usado pelo webhook)
    plan_expires_at     TIMESTAMPTZ,                    -- não utilizado atualmente
    welcomed            BOOLEAN NOT NULL DEFAULT FALSE, -- email de boas-vindas já enviado
    lang                TEXT NOT NULL DEFAULT 'pt',     -- idioma dos emails: pt | en
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Modelos 3D
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS models (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    input_type    TEXT NOT NULL DEFAULT 'ai_single',
    status        TEXT NOT NULL DEFAULT 'pending', -- pending | processing | done | error
    frames_count  INT,

    -- ficheiros produzidos pelo job do Modal
    model_url     TEXT,   -- .glb  (malha com textura)
    splat_url     TEXT,   -- .ply  (Gaussian Splatting, vista realista)
    stl_url       TEXT,   -- .stl  (impressão 3D)
    obj_url       TEXT,   -- legado; já não é preenchido
    thumbnail_url TEXT,   -- render do modelo, fundo branco
    source_url    TEXT,   -- cópia pública da 1ª foto de entrada (galeria)

    watermark     BOOLEAN NOT NULL DEFAULT TRUE,  -- definido conforme o plano no /reconstruct
    is_public     BOOLEAN NOT NULL DEFAULT FALSE, -- link partilhavel e widget de embed
    gallery       BOOLEAN NOT NULL DEFAULT FALSE, -- mostrar na galeria da pagina inicial (curadoria manual)
    error_msg     TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at    TIMESTAMPTZ                     -- 30d free, 90d creator, NULL pro
);

CREATE INDEX IF NOT EXISTS models_user_idx   ON models (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS models_public_idx  ON models (is_public, status);
CREATE INDEX IF NOT EXISTS models_gallery_idx ON models (gallery, status);

-- ------------------------------------------------------------
-- Criar o perfil automaticamente quando nasce um utilizador
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- O idioma vem da metadata enviada no registo (seletor PT/EN do site)
    INSERT INTO public.user_profiles (id, lang)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'lang', 'pt'))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE models        ENABLE ROW LEVEL SECURITY;

-- Cada utilizador só acede ao seu próprio perfil
DROP POLICY IF EXISTS "user_own_profile" ON user_profiles;
CREATE POLICY "user_own_profile" ON user_profiles
    FOR ALL USING (auth.uid() = id);

-- Cada utilizador só acede aos seus próprios modelos
DROP POLICY IF EXISTS "user_sees_own_models" ON models;
CREATE POLICY "user_sees_own_models" ON models
    FOR ALL USING (auth.uid() = user_id);

-- ⚠️ ESSENCIAL: sem esta política o widget de embed não funciona para os
-- visitantes das lojas dos clientes, e a galeria pública fica vazia.
DROP POLICY IF EXISTS "public_models_readable" ON models;
CREATE POLICY "public_models_readable" ON models
    FOR SELECT TO anon
    USING (is_public = TRUE AND status = 'done');

-- ------------------------------------------------------------
-- Storage
-- ------------------------------------------------------------
-- Criar dois buckets no painel (Storage → Buckets):
--   uploads  → PRIVADO  (fotos de entrada)
--   models   → PÚBLICO  (.glb, .ply, .stl, miniaturas, foto de origem)
--
-- O backend e o job do Modal escrevem com a service key, que ignora o RLS.
