-- ============================================
-- 1. CORREÇÃO RLS - PERMITE INSERT IMEDIATAMENTE
-- ============================================
ALTER TABLE servicos DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE favoritos DISABLE ROW LEVEL SECURITY;
ALTER TABLE contatos DISABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. ADICIONAR COLUNAS
-- ============================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE servicos  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'arquivado', 'excluido'));
UPDATE servicos SET status = 'ativo' WHERE status IS NULL;

-- ============================================
-- 3. TORNAR EMAIL COMO ADMIN
-- ============================================
UPDATE usuarios SET is_admin = true WHERE email = 'lsmello93@hotmail.com';

-- ============================================
-- 4. REATIVAR RLS COM POLICIES CORRETAS
-- ============================================
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- SERVICOS
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
  (SELECT is_admin FROM usuarios WHERE email = auth.email()) = true
  OR criado_por IN (SELECT id FROM usuarios WHERE email = auth.email())
);

DROP POLICY IF EXISTS "Delete servicos" ON servicos;
CREATE POLICY "Delete servicos" ON servicos FOR DELETE USING (
  auth.email() IS NOT NULL
  AND (SELECT is_admin FROM usuarios WHERE email = auth.email()) = true
);

-- USUARIOS
DROP POLICY IF EXISTS "Insert usuarios" ON usuarios;
CREATE POLICY "Insert usuarios" ON usuarios FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Select usuarios" ON usuarios;
CREATE POLICY "Select usuarios" ON usuarios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Update usuarios" ON usuarios;
CREATE POLICY "Update usuarios" ON usuarios FOR UPDATE USING (
  email = auth.email() OR (SELECT is_admin FROM usuarios WHERE email = auth.email()) = true
);

-- FAVORITOS
DROP POLICY IF EXISTS "Insert favoritos" ON favoritos;
CREATE POLICY "Insert favoritos" ON favoritos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Select favoritos" ON favoritos;
CREATE POLICY "Select favoritos" ON favoritos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Delete favoritos" ON favoritos;
CREATE POLICY "Delete favoritos" ON favoritos FOR DELETE USING (true);

-- CONTATOS
DROP POLICY IF EXISTS "Insert contatos" ON contatos;
CREATE POLICY "Insert contatos" ON contatos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Select contatos" ON contatos;
CREATE POLICY "Select contatos" ON contatos FOR SELECT USING (true);

-- AVALIACOES
DROP POLICY IF EXISTS "Insert avaliacoes" ON avaliacoes;
CREATE POLICY "Insert avaliacoes" ON avaliacoes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Select avaliacoes" ON avaliacoes;
CREATE POLICY "Select avaliacoes" ON avaliacoes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Delete avaliacoes" ON avaliacoes;
CREATE POLICY "Delete avaliacoes" ON avaliacoes FOR DELETE USING (true);

-- CATEGORIAS
DROP POLICY IF EXISTS "Select categorias" ON categorias;
CREATE POLICY "Select categorias" ON categorias FOR SELECT USING (true);

-- ============================================
-- 5. VIEW (só serviços ativos na vitrine)
-- ============================================
DROP VIEW IF EXISTS v_servicos_destaque;
CREATE VIEW v_servicos_destaque AS
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
