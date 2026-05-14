-- ============================================================
-- Scan3D — Jobs automáticos com pg_cron
-- Colar no Supabase SQL Editor DEPOIS de ativar pg_cron:
--   Database → Extensions → procurar "pg_cron" → Enable
-- ============================================================

-- 1. Resetar contador de modelos no início de cada mês (dia 1, às 00:00 UTC)
SELECT cron.schedule(
    'reset-monthly-model-counts',
    '0 0 1 * *',
    'UPDATE user_profiles SET models_this_month = 0'
);

-- 2. Apagar modelos expirados diariamente (às 03:00 UTC)
SELECT cron.schedule(
    'delete-expired-models',
    '0 3 * * *',
    $$
        DELETE FROM models
        WHERE expires_at < NOW()
          AND status = 'done'
    $$
);

-- 3. Limpar uploads antigos no Storage (ficheiros de modelos que expiraram)
--    Nota: isto apaga apenas o registo da BD; os ficheiros no Storage
--    precisam de ser apagados via Edge Function (ver abaixo)

-- Para verificar os jobs agendados:
-- SELECT * FROM cron.job;

-- Para remover um job:
-- SELECT cron.unschedule('reset-monthly-model-counts');
