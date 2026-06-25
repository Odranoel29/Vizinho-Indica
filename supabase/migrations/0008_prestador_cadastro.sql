-- Add provider registration fields to usuarios
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS empresa_nome TEXT,
  ADD COLUMN IF NOT EXISTS celular TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS categoria_prestador BIGINT REFERENCES categorias(id),
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS google_place_id TEXT,
  ADD COLUMN IF NOT EXISTS google_rating NUMERIC(2,1),
  ADD COLUMN IF NOT EXISTS google_review_count INTEGER,
  ADD COLUMN IF NOT EXISTS comprovante_url TEXT;

-- Recreate view with new fields
DROP VIEW IF EXISTS v_servicos_destaque;

CREATE OR REPLACE VIEW v_servicos_destaque AS
SELECT
  s.id AS servico_id,
  s.titulo, s.descricao, s.preco_estimado, s.preco_detalhe,
  s.foto_url, s.whatsapp,
  s.criado_por AS autor_id,
  u.nome_completo AS autor_nome,
  u.empresa_nome AS autor_empresa,
  u.cidade AS autor_cidade,
  u.avatar_url AS autor_avatar,
  u.bio AS autor_bio,
  u.google_rating AS autor_google_rating,
  u.google_review_count AS autor_google_review_count,
  c.categorias AS categoria_nome,
  sb.nome AS subcategoria_nome,
  COALESCE(AVG(a.nota), 0) AS media_notas,
  COUNT(a.id) AS total_avaliacoes
FROM servicos s
LEFT JOIN usuarios u ON s.criado_por = u.id
LEFT JOIN categorias c ON s.categoria = c.id
LEFT JOIN subcategorias sb ON s.subcategoria_id = sb.id
LEFT JOIN avaliacoes a ON s.id = a.servico_id
WHERE s.status = 'ativo'
GROUP BY s.id, u.nome_completo, u.empresa_nome, u.cidade, u.avatar_url, u.bio, u.google_rating, u.google_review_count, c.categorias, sb.nome;

GRANT SELECT ON v_servicos_destaque TO anon, authenticated;
