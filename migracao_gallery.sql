-- ============================================================
-- Separar "link partilhável" de "aparece na galeria da homepage".
--
-- Até aqui, is_public = TRUE fazia as duas coisas ao mesmo tempo. Isso é um
-- problema a partir do momento em que geras modelos para prospetos: as fotos
-- são das lojas deles e apareceriam na página inicial do snap3d.app.
--
-- COMO CORRER: painel do Supabase -> SQL Editor -> New query -> colar -> Run.
-- Correr ANTES de publicar o frontend novo.
-- ============================================================

-- 1. Coluna nova
ALTER TABLE models ADD COLUMN IF NOT EXISTS gallery BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS models_gallery_idx ON models (gallery, status);

-- 2. Marcar os modelos que a galeria já mostrava, para nada mudar na homepage.
--    (Esta condição é exatamente a que o componente ExamplesGallery usava.)
UPDATE models SET gallery = TRUE
WHERE is_public = TRUE AND status = 'done' AND thumbnail_url IS NOT NULL;

-- 3. Confirmação: devem aparecer os exemplos atuais da galeria
SELECT name, created_at FROM models WHERE gallery ORDER BY created_at DESC;


-- ------------------------------------------------------------
-- Depois disto, a galeria é curadoria manual. Para acrescentar um exemplo:
--   UPDATE models SET gallery = TRUE  WHERE id = '<id-do-modelo>';
-- Para retirar:
--   UPDATE models SET gallery = FALSE WHERE id = '<id-do-modelo>';
--
-- Os modelos gerados pelo agente de prospeção ficam sempre com gallery = FALSE.
-- ------------------------------------------------------------
