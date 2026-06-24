-- ============================================
-- SECURITY FIXES: RLS em todas as tabelas
-- ============================================

-- ============================================
-- 1. FIX: servicos INSERT — exigir auth
-- ============================================
DROP POLICY IF EXISTS "Insert servicos" ON servicos;
CREATE POLICY "Insert servicos" ON servicos FOR INSERT TO authenticated
  WITH CHECK (
    criado_por IN (SELECT id FROM usuarios WHERE email = auth.email())
  );

-- ============================================
-- 2. favoritos: RLS + policies (usuario_id = usuarios.id bigint)
-- ============================================
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Select own favoritos" ON favoritos;
CREATE POLICY "Select own favoritos" ON favoritos FOR SELECT TO authenticated
  USING (usuario_id IN (SELECT id FROM usuarios WHERE email = auth.email()));

DROP POLICY IF EXISTS "Insert own favoritos" ON favoritos;
CREATE POLICY "Insert own favoritos" ON favoritos FOR INSERT TO authenticated
  WITH CHECK (usuario_id IN (SELECT id FROM usuarios WHERE email = auth.email()));

DROP POLICY IF EXISTS "Delete own favoritos" ON favoritos;
CREATE POLICY "Delete own favoritos" ON favoritos FOR DELETE TO authenticated
  USING (usuario_id IN (SELECT id FROM usuarios WHERE email = auth.email()));

-- ============================================
-- 3. avaliacoes: RLS + policies (autor_id = usuarios.id numeric)
-- ============================================
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Select avaliacoes" ON avaliacoes;
CREATE POLICY "Select avaliacoes" ON avaliacoes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Insert own avaliacao" ON avaliacoes;
CREATE POLICY "Insert own avaliacao" ON avaliacoes FOR INSERT TO authenticated
  WITH CHECK (autor_id IN (SELECT id FROM usuarios WHERE email = auth.email()));

-- ============================================
-- 5. denuncias: ADD UPDATE policy para admin
-- ============================================
DROP POLICY IF EXISTS "Admin update denuncias" ON denuncias;
CREATE POLICY "Admin update denuncias" ON denuncias FOR UPDATE TO authenticated
  USING ((SELECT is_admin FROM usuarios WHERE email = auth.email()) = true)
  WITH CHECK ((SELECT is_admin FROM usuarios WHERE email = auth.email()) = true);

-- ============================================
-- 6. usuarios: ADD SELECT policy
-- ============================================
DROP POLICY IF EXISTS "Select usuarios" ON usuarios;
CREATE POLICY "Select usuarios" ON usuarios FOR SELECT
  USING (true);
