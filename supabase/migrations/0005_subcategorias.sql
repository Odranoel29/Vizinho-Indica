-- ============================================
-- Migration 0005: Subcategorias (nichos)
-- ============================================

-- Inserir novas categorias se não existirem
INSERT INTO categorias (categorias) SELECT 'Automóveis' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE categorias = 'Automóveis');
INSERT INTO categorias (categorias) SELECT 'Tecnologia' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE categorias = 'Tecnologia');
INSERT INTO categorias (categorias) SELECT 'Eventos e Festas' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE categorias = 'Eventos e Festas');

-- Tabela de subcategorias
CREATE TABLE IF NOT EXISTS subcategorias (
  id BIGSERIAL PRIMARY KEY,
  categoria_id BIGINT NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  UNIQUE(categoria_id, nome)
);

ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subcategorias pública" ON subcategorias FOR SELECT USING (true);
GRANT SELECT ON subcategorias TO anon, authenticated;

-- Seed subcategorias
DO $$
DECLARE
  cat_id BIGINT;
BEGIN
  -- Reformas (id 1)
  cat_id := (SELECT id FROM categorias WHERE categorias = 'Reformas' LIMIT 1);
  INSERT INTO subcategorias (categoria_id, nome) VALUES
    (cat_id, 'Pintura'), (cat_id, 'Elétrica'), (cat_id, 'Hidráulica'),
    (cat_id, 'Alvenaria'), (cat_id, 'Marcenaria'), (cat_id, 'Pisos e Revestimentos'),
    (cat_id, 'Telhado'), (cat_id, 'Instalações'), (cat_id, 'Pequenos Reparos'),
    (cat_id, 'Design de Interiores')
  ON CONFLICT (categoria_id, nome) DO NOTHING;

  -- Aulas / Educação (id 2)
  cat_id := (SELECT id FROM categorias WHERE categorias = 'Aulas' LIMIT 1);
  INSERT INTO subcategorias (categoria_id, nome) VALUES
    (cat_id, 'Reforço Escolar'), (cat_id, 'Música'), (cat_id, 'Dança'),
    (cat_id, 'Idiomas'), (cat_id, 'Artesanato'), (cat_id, 'Yoga e Pilates'),
    (cat_id, 'Informática'), (cat_id, 'Esportes')
  ON CONFLICT (categoria_id, nome) DO NOTHING;

  -- Culinária (id 3)
  cat_id := (SELECT id FROM categorias WHERE categorias = 'Culinária' LIMIT 1);
  INSERT INTO subcategorias (categoria_id, nome) VALUES
    (cat_id, 'Bolos e Doces'), (cat_id, 'Salgados'), (cat_id, 'Massas'),
    (cat_id, 'Comida Fit'), (cat_id, 'Marmita Fit'), (cat_id, 'Churrasco'),
    (cat_id, 'Comida Japonesa'), (cat_id, 'Comida Árabe'), (cat_id, 'Congelados'),
    (cat_id, 'Buffet')
  ON CONFLICT (categoria_id, nome) DO NOTHING;

  -- Saúde e Bem-Estar (id 4)
  cat_id := (SELECT id FROM categorias WHERE categorias = 'Saúde' LIMIT 1);
  INSERT INTO subcategorias (categoria_id, nome) VALUES
    (cat_id, 'Sobrancelha'), (cat_id, 'Cabelo'), (cat_id, 'Corporal (Massagem)'),
    (cat_id, 'Estética Facial'), (cat_id, 'Depilação'), (cat_id, 'Manicure e Pedicure'),
    (cat_id, 'Maquiagem'), (cat_id, 'Terapias'), (cat_id, 'Personal Trainer'),
    (cat_id, 'Fisioterapia'), (cat_id, 'Nutrição'), (cat_id, 'Psicologia')
  ON CONFLICT (categoria_id, nome) DO NOTHING;

  -- Serviços Domésticos (id 5)
  cat_id := (SELECT id FROM categorias WHERE categorias = 'Serviços Domésticos' LIMIT 1);
  INSERT INTO subcategorias (categoria_id, nome) VALUES
    (cat_id, 'Limpeza'), (cat_id, 'Passar Roupa'), (cat_id, 'Faxina'),
    (cat_id, 'Jardim'), (cat_id, 'Piscina'), (cat_id, 'Dedetização'),
    (cat_id, 'Mudanças'), (cat_id, 'Organização')
  ON CONFLICT (categoria_id, nome) DO NOTHING;

  -- Automóveis
  cat_id := (SELECT id FROM categorias WHERE categorias = 'Automóveis' LIMIT 1);
  INSERT INTO subcategorias (categoria_id, nome) VALUES
    (cat_id, 'Higienização'), (cat_id, 'Lavagem'), (cat_id, 'Reparo Mecânico'),
    (cat_id, 'Funilaria e Pintura'), (cat_id, 'Troca de Óleo'), (cat_id, 'Elétrica Automotiva'),
    (cat_id, 'Estética Automotiva'), (cat_id, 'Guincho')
  ON CONFLICT (categoria_id, nome) DO NOTHING;

  -- Tecnologia
  cat_id := (SELECT id FROM categorias WHERE categorias = 'Tecnologia' LIMIT 1);
  INSERT INTO subcategorias (categoria_id, nome) VALUES
    (cat_id, 'Manutenção de Computadores'), (cat_id, 'Formatação'), (cat_id, 'Redes e Internet'),
    (cat_id, 'Suporte Técnico'), (cat_id, 'Criação de Sites'),
    (cat_id, 'Automação de Atendimento')
  ON CONFLICT (categoria_id, nome) DO NOTHING;

  -- Eventos e Festas
  cat_id := (SELECT id FROM categorias WHERE categorias = 'Eventos e Festas' LIMIT 1);
  INSERT INTO subcategorias (categoria_id, nome) VALUES
    (cat_id, 'Fotografia'), (cat_id, 'Filmagem'), (cat_id, 'Buffet'),
    (cat_id, 'Decoração'), (cat_id, 'DJ'), (cat_id, 'Cerimonial')
  ON CONFLICT (categoria_id, nome) DO NOTHING;
END $$;

-- Adicionar coluna subcategoria_id à tabela servicos
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS subcategoria_id BIGINT REFERENCES subcategorias(id) ON DELETE SET NULL;

-- Atualizar view v_servicos_destaque para incluir subcategoria
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
  sb.nome AS subcategoria_nome,
  COALESCE(AVG(a.nota), 0) AS media_notas,
  COUNT(a.id) AS total_avaliacoes
FROM servicos s
LEFT JOIN usuarios u ON s.criado_por = u.id
LEFT JOIN categorias c ON s.categoria = c.id
LEFT JOIN subcategorias sb ON s.subcategoria_id = sb.id
LEFT JOIN avaliacoes a ON s.id = a.servico_id
WHERE s.status = 'ativo'
GROUP BY s.id, u.nome_completo, u.avatar_url, u.bio, c.categorias, sb.nome;

GRANT SELECT ON v_servicos_destaque TO anon, authenticated;
