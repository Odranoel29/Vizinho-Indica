-- ============================================
-- POLICIES categorias e subcategorias
-- ============================================
DROP POLICY IF EXISTS "Select categorias" ON categorias;
CREATE POLICY "Select categorias" ON categorias FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Select subcategorias" ON subcategorias;
CREATE POLICY "Select subcategorias" ON subcategorias FOR SELECT
  USING (true);
