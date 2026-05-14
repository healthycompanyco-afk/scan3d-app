-- ============================================================
-- Scan3D — Esquema da base de dados (colar no Supabase SQL Editor)
-- ============================================================

-- Perfil do utilizador (plano, contadores)
CREATE TABLE user_profiles (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan                TEXT NOT NULL DEFAULT 'free',         -- 'free' | 'creator' | 'pro'
    models_this_month   INT  NOT NULL DEFAULT 0,
    stripe_customer_id  TEXT,
    plan_expires_at     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Modelos 3D
CREATE TABLE models (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    input_type    TEXT NOT NULL DEFAULT 'video',   -- 'video' | 'photos'
    status        TEXT NOT NULL DEFAULT 'pending', -- pending | extracting | processing | done | error
    frames_count  INT,
    model_url     TEXT,   -- URL do .glb no Supabase Storage
    obj_url       TEXT,   -- URL do .obj
    stl_url       TEXT,   -- URL do .stl (apenas plano Pro)
    is_public     BOOLEAN NOT NULL DEFAULT FALSE,
    error_msg     TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);

-- ============================================================
-- Segurança: Row Level Security
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Utilizador vê e edita apenas o seu próprio perfil
CREATE POLICY "user_own_profile" ON user_profiles
    FOR ALL USING (auth.uid() = id);

-- Utilizador vê apenas os seus próprios modelos
CREATE POLICY "user_own_models" ON models
    FOR ALL USING (auth.uid() = user_id);

-- Modelos públicos são visíveis a todos (para o embed widget)
CREATE POLICY "public_models_read" ON models
    FOR SELECT USING (is_public = TRUE);

-- ============================================================
-- Trigger: criar perfil automaticamente quando um utilizador se regista
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Trigger: resetar contador mensal de modelos no início de cada mês
-- (usar com pg_cron — ativar em Supabase: Database → Extensions → pg_cron)
-- ============================================================

-- SELECT cron.schedule('reset-monthly-counts', '0 0 1 * *',
--     'UPDATE user_profiles SET models_this_month = 0'
-- );

-- ============================================================
-- Trigger: apagar modelos expirados (corre diariamente)
-- ============================================================

-- SELECT cron.schedule('delete-expired-models', '0 3 * * *',
--     'DELETE FROM models WHERE expires_at < NOW() AND status = ''done'''
-- );

-- ============================================================
-- Supabase Storage buckets (criar manualmente em Storage → New bucket)
-- ============================================================
-- Bucket "uploads"  → privado → guardar fotos/vídeos enviados pelos utilizadores
-- Bucket "models"   → público → guardar ficheiros .glb, .obj, .stl finais
