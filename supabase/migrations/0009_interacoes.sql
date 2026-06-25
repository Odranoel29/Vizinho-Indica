-- ============================================
-- Migration 0009: Interações + Avaliações Verificadas
-- ============================================

-- Drop old tables if re-running
DROP TABLE IF EXISTS interacoes CASCADE;
DROP TABLE IF EXISTS avaliacoes CASCADE;
DROP FUNCTION IF EXISTS liberar_interacoes_pendentes;

-- ============================================
-- 1. interacoes
-- ============================================
CREATE TABLE interacoes (
  id BIGSERIAL PRIMARY KEY,
  prestador_id BIGINT NOT NULL REFERENCES usuarios(id),
  cliente_nome TEXT NOT NULL,
  cliente_whatsapp TEXT NOT NULL,
  data_contato TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'LIBERADO', 'AVALIADO', 'CANCELADO')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE interacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Select interacoes" ON interacoes;
CREATE POLICY "Select interacoes" ON interacoes FOR SELECT
  USING (
    prestador_id IN (SELECT id FROM usuarios WHERE email = auth.email())
    OR (SELECT is_admin FROM usuarios WHERE email = auth.email()) = true
  );

DROP POLICY IF EXISTS "Insert interacoes" ON interacoes;
CREATE POLICY "Insert interacoes" ON interacoes FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Update interacoes" ON interacoes;
CREATE POLICY "Update interacoes" ON interacoes FOR UPDATE TO authenticated
  USING (
    prestador_id IN (SELECT id FROM usuarios WHERE email = auth.email())
    OR (SELECT is_admin FROM usuarios WHERE email = auth.email()) = true
  );

GRANT SELECT, INSERT, UPDATE ON interacoes TO authenticated;

-- Índices
CREATE INDEX IF NOT EXISTS idx_interacoes_prestador_id ON interacoes(prestador_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_cliente_whatsapp ON interacoes(cliente_whatsapp);
CREATE INDEX IF NOT EXISTS idx_interacoes_status ON interacoes(status);
CREATE INDEX IF NOT EXISTS idx_interacoes_data_contato ON interacoes(data_contato);

-- ============================================
-- 2. avaliacoes (verificadas)
-- ============================================
CREATE TABLE avaliacoes (
  id BIGSERIAL PRIMARY KEY,
  interacao_id BIGINT NOT NULL UNIQUE REFERENCES interacoes(id),
  prestador_id BIGINT NOT NULL REFERENCES usuarios(id),
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  data_avaliacao TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Select avaliacoes" ON avaliacoes;
CREATE POLICY "Select avaliacoes" ON avaliacoes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Insert avaliacoes" ON avaliacoes;
CREATE POLICY "Insert avaliacoes" ON avaliacoes FOR INSERT TO authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON avaliacoes TO authenticated;

-- Índices
CREATE INDEX IF NOT EXISTS idx_avaliacoes_prestador_id ON avaliacoes(prestador_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_interacao_id ON avaliacoes(interacao_id);

-- ============================================
-- 3. Campos de métricas em usuarios
-- ============================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS total_avaliacoes INTEGER DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS media_avaliacoes NUMERIC(2,1) DEFAULT 0;

-- ============================================
-- 4. Função para recalcular métricas do prestador
-- ============================================
CREATE OR REPLACE FUNCTION recalcular_metricas_prestador(p_prestador_id BIGINT)
RETURNS void AS $$
DECLARE
  v_total INTEGER;
  v_media NUMERIC(2,1);
BEGIN
  SELECT COUNT(*), COALESCE(AVG(nota), 0)
  INTO v_total, v_media
  FROM avaliacoes
  WHERE prestador_id = p_prestador_id;

  UPDATE usuarios
  SET total_avaliacoes = v_total,
      media_avaliacoes = v_media
  WHERE id = p_prestador_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
