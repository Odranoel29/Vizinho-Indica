-- ============================================
-- Migration 0004: Workflow de Denúncias + Alertas
-- ============================================

-- Colunas de workflow para denuncias
ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'aguardando', 'finalizada'));
ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS resultado text CHECK (resultado IN ('positivo', 'alerta'));
ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS observacao text;

-- Contador de alertas para prestadores (3 alertas = expulso)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS alertas integer DEFAULT 0;

-- Status de pagamento (verde = pago, vermelho = aberto)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pagamento_status text DEFAULT 'aberto' CHECK (pagamento_status IN ('pago', 'aberto'));

-- Atualizar denúncias existentes para pendente
UPDATE denuncias SET status = 'pendente' WHERE status IS NULL;

-- Atualizar prestadores existentes com pagamento_status
UPDATE usuarios SET pagamento_status = 'pago' WHERE tipo = 'prestador' AND prestador_aprovado = true AND pagamento_status IS NULL;
UPDATE usuarios SET pagamento_status = 'aberto' WHERE tipo = 'prestador' AND pagamento_status IS NULL;

UPDATE usuarios SET alertas = 0 WHERE alertas IS NULL;
