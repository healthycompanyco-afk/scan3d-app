-- ============================================================
-- BUG: models.expires_at está NOT NULL em produção, mas o backend escreve
-- NULL para o plano Pro ("nunca expira"). O primeiro cliente Pro a gerar um
-- modelo apanhava um erro e a geração falhava.
--
-- Hoje não há clientes Pro, por isso ninguém foi afetado. Correr antes de
-- haver um.
--
-- Correr no Supabase: SQL Editor -> New query -> colar -> Run.
-- ============================================================

ALTER TABLE models ALTER COLUMN expires_at DROP NOT NULL;

-- Confirmação: deve dizer is_nullable = YES
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'models' AND column_name = 'expires_at';
