-- ============================================================
-- Origem de cada registo (utm_source e companhia).
--
-- Sem isto, gastar em publicidade compra cliques e nenhuma informação: não
-- se sabe que anúncio, campanha ou publicação trouxe cada utilizador.
--
-- É atribuição de PRIMEIRO TOQUE: grava-se uma vez e não se reescreve. Quem
-- chega por um anúncio e volta uma semana depois por pesquisa continua a
-- contar para o anúncio.
--
-- COMO CORRER: painel do Supabase -> SQL Editor -> New query -> colar -> Run.
-- ============================================================

-- 1. Colunas novas
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS utm_source   TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS utm_medium   TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- 2. O trigger passa a copiar a origem enviada no registo, tal como já faz
--    com o idioma. Quem entra com Google não traz metadata — nesses casos o
--    frontend grava a origem na primeira visita ao painel.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, lang, utm_source, utm_medium, utm_campaign)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'lang', 'pt'),
        NEW.raw_user_meta_data->>'utm_source',
        NEW.raw_user_meta_data->>'utm_medium',
        NEW.raw_user_meta_data->>'utm_campaign'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- 3. Confirmação: devem aparecer as três colunas
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name LIKE 'utm%';


-- ------------------------------------------------------------
-- Relatório: registos por origem, do mais recente para trás.
-- Correr sempre que quiseres saber o que a publicidade está a dar.
-- ------------------------------------------------------------
-- SELECT COALESCE(utm_source, 'direto')   AS origem,
--        COALESCE(utm_campaign, '-')      AS campanha,
--        COUNT(*)                         AS registos,
--        COUNT(*) FILTER (WHERE plan <> 'free') AS pagantes
-- FROM user_profiles
-- GROUP BY 1, 2
-- ORDER BY registos DESC;
