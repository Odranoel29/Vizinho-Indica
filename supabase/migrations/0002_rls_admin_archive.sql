-- ============================================
-- ADICIONAR COLUNAS
-- ============================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE servicos  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'arquivado', 'excluido'));

UPDATE servicos SET status = 'ativo' WHERE status IS NULL;

-- ============================================
-- POLICIES servicos
-- ============================================
DROP POLICY IF EXISTS "Select servicos" ON servicos;
CREATE POLICY "Select servicos" ON servicos FOR SELECT USING (
  status = 'ativo'
  OR (auth.email() IS NOT NULL AND (
    criado_por IN (SELECT id FROM usuarios WHERE email = auth.email())
    OR (SELECT is_admin FROM usuarios WHERE email = auth.email()) = true
  ))
);

DROP POLICY IF EXISTS "Insert servicos" ON servicos;
CREATE POLICY "Insert servicos" ON servicos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Update servicos" ON servicos;
CREATE POLICY "Update servicos" ON servicos FOR UPDATE USING (
  auth.email() IS NOT NULL AND (
    criado_por IN (SELECT id FROM usuarios WHERE email = auth.email())
    OR (SELECT is_admin FROM usuarios WHERE email = auth.email()) = true
  )
) WITH CHECK (
  -- Creator can update anything; admin can update anything
  (SELECT is_admin FROM usuarios WHERE email = auth.email()) = true
  OR criado_por IN (SELECT id FROM usuarios WHERE email = auth.email())
);

DROP POLICY IF EXISTS "Delete servicos" ON servicos;
CREATE POLICY "Delete servicos" ON servicos FOR DELETE USING (
  auth.email() IS NOT NULL
  AND (SELECT is_admin FROM usuarios WHERE email = auth.email()) = true
);

-- ============================================
-- POLICIES usuarios (admins podem editar qq um)
-- ============================================
DROP POLICY IF EXISTS "Update usuarios" ON usuarios;
CREATE POLICY "Update usuarios" ON usuarios FOR UPDATE USING (
  email = auth.email() OR (SELECT is_admin FROM usuarios WHERE email = auth.email()) = true
);

-- ============================================
-- VIEW v_servicos_destaque (só ativos)
-- ============================================
CREATE OR REPLACE VIEW v_servicos_destaque AS
SELECT
  s.id AS servico_id,
  s.titulo,
  s.descricao,
  s.preco_estimado,
  s.preco_detalhe,
  s.foto_url,
  s.whatsapp,
  s.criado_por AS autor_id,
  u.nome_completo AS autor_nome,
  u.avatar_url AS autor_avatar,
  u.bio AS autor_bio,
  c.categorias AS categoria_nome,
  COALESCE(AVG(a.nota), 0) AS media_notas,
  COUNT(a.id) AS total_avaliacoes
FROM servicos s
LEFT JOIN usuarios u ON s.criado_por = u.id
LEFT JOIN categorias c ON s.categoria = c.id
LEFT JOIN avaliacoes a ON s.id = a.servico_id
WHERE s.status = 'ativo'
GROUP BY s.id, u.nome_completo, u.avatar_url, u.bio, c.categorias;

GRANT SELECT ON v_servicos_destaque TO anon, authenticated;
