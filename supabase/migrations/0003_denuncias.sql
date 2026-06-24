-- ============================================
-- Migration 0003: Tabela de Denúncias
-- ============================================

DROP TABLE IF EXISTS denuncias CASCADE;

CREATE TABLE denuncias (
  id BIGSERIAL PRIMARY KEY,
  servico_id BIGINT NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(servico_id, autor_id)
);

ALTER TABLE denuncias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários logados podem denunciar" ON denuncias
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = autor_id);

CREATE POLICY "Denúncias visíveis para admin" ON denuncias
  FOR SELECT
  TO authenticated
  USING (
    (SELECT is_admin FROM usuarios WHERE email = auth.email()) = true
  );

GRANT SELECT, INSERT ON denuncias TO authenticated;
