-- ============================================================
-- EduMoz — Schema da Base de Dados
-- Copia e cola isto no Supabase SQL Editor
-- Supabase → SQL Editor → New Query → Cola → Run
-- ============================================================

-- PROVÍNCIAS
CREATE TABLE IF NOT EXISTS provincias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  codigo VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESCOLAS
CREATE TABLE IF NOT EXISTS escolas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('primaria_ep1','primaria_ep2','secundaria_esg1','secundaria_esg2','ipeme','outro')),
  provincia VARCHAR(100) NOT NULL,
  distrito VARCHAR(100),
  telefone VARCHAR(20),
  email VARCHAR(100),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  status VARCHAR(20) DEFAULT 'ativa',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFESSORES
CREATE TABLE IF NOT EXISTS professores (
  id SERIAL PRIMARY KEY,
  nome_completo VARCHAR(200) NOT NULL,
  genero CHAR(1) CHECK (genero IN ('M','F')),
  data_nascimento DATE,
  qualificacao VARCHAR(100),
  disciplinas TEXT[],
  escola_id INTEGER REFERENCES escolas(id),
  provincia VARCHAR(100),
  status VARCHAR(20) DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ALUNOS
CREATE TABLE IF NOT EXISTS alunos (
  id SERIAL PRIMARY KEY,
  nome_completo VARCHAR(200) NOT NULL,
  genero CHAR(1) CHECK (genero IN ('M','F')),
  data_nascimento DATE,
  serie VARCHAR(20),
  turma VARCHAR(10),
  escola_id INTEGER REFERENCES escolas(id),
  ano_lectivo INTEGER NOT NULL DEFAULT 2025,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo','inativo','transferido','evadido','concluido')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESTATÍSTICAS PROVINCIAIS (preenchida com dados reais ou migrados)
CREATE TABLE IF NOT EXISTS estatisticas_provinciais (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  codigo VARCHAR(10),
  ano_lectivo INTEGER NOT NULL,
  total_alunos INTEGER DEFAULT 0,
  total_escolas INTEGER DEFAULT 0,
  total_professores INTEGER DEFAULT 0,
  taxa_aprovacao DECIMAL(5,2) DEFAULT 0,
  taxa_reprovacao DECIMAL(5,2) DEFAULT 0,
  taxa_evasao DECIMAL(5,2) DEFAULT 0,
  ratio_professor_aluno DECIMAL(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nome, ano_lectivo)
);

-- MATRÍCULAS ANUAIS (para o gráfico de evolução)
CREATE TABLE IF NOT EXISTS matriculas_anuais (
  id SERIAL PRIMARY KEY,
  ano_lectivo INTEGER UNIQUE NOT NULL,
  total_masculino INTEGER DEFAULT 0,
  total_feminino INTEGER DEFAULT 0,
  total_geral INTEGER GENERATED ALWAYS AS (total_masculino + total_feminino) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RESULTADOS ANUAIS (por escola)
CREATE TABLE IF NOT EXISTS resultados_anuais (
  id SERIAL PRIMARY KEY,
  escola_id INTEGER REFERENCES escolas(id),
  ano_lectivo INTEGER NOT NULL,
  taxa_aprovacao DECIMAL(5,2) DEFAULT 0,
  taxa_reprovacao DECIMAL(5,2) DEFAULT 0,
  taxa_evasao DECIMAL(5,2) DEFAULT 0,
  total_alunos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(escola_id, ano_lectivo)
);

-- ============================================================
-- DADOS DE EXEMPLO (para o dashboard funcionar imediatamente)
-- ============================================================

INSERT INTO provincias (nome, codigo) VALUES
  ('Maputo Cidade',  'MPM'),
  ('Maputo Província','MPC'),
  ('Gaza',           'GZA'),
  ('Inhambane',      'INH'),
  ('Sofala',         'SOF'),
  ('Manica',         'MAN'),
  ('Tete',           'TET'),
  ('Zambézia',       'ZAM'),
  ('Nampula',        'NAM'),
  ('Cabo Delgado',   'CAD'),
  ('Niassa',         'NIA')
ON CONFLICT DO NOTHING;

INSERT INTO estatisticas_provinciais (nome, codigo, ano_lectivo, total_alunos, total_escolas, total_professores, taxa_aprovacao, taxa_reprovacao, taxa_evasao, ratio_professor_aluno) VALUES
  ('Maputo Cidade',   'MPM', 2025, 890000,  312,  14200, 86.0, 6.0,  8.0,  42),
  ('Maputo Província','MPC', 2025, 620000,  498,  11300, 82.0, 8.0,  10.0, 45),
  ('Gaza',            'GZA', 2025, 480000,  624,  9100,  76.0, 11.0, 13.0, 48),
  ('Inhambane',       'INH', 2025, 420000,  712,  7800,  74.0, 11.0, 15.0, 50),
  ('Sofala',          'SOF', 2025, 550000,  698,  9800,  73.0, 13.0, 14.0, 52),
  ('Manica',          'MAN', 2025, 380000,  586,  6700,  71.0, 13.0, 16.0, 55),
  ('Tete',            'TET', 2025, 510000,  742,  8900,  70.0, 13.0, 17.0, 57),
  ('Zambézia',        'ZAM', 2025, 720000,  980,  11200, 69.0, 12.0, 19.0, 61),
  ('Nampula',         'NAM', 2025, 880000,  1102, 13400, 72.0, 10.0, 18.0, 58),
  ('Cabo Delgado',    'CAD', 2025, 410000,  698,  6200,  68.0, 10.0, 22.0, 63),
  ('Niassa',          'NIA', 2025, 310000,  512,  4800,  66.0, 13.0, 21.0, 67)
ON CONFLICT DO NOTHING;

INSERT INTO matriculas_anuais (ano_lectivo, total_masculino, total_feminino) VALUES
  (2019, 2100000, 1900000),
  (2020, 2200000, 2050000),
  (2021, 2350000, 2150000),
  (2022, 2400000, 2300000),
  (2023, 2500000, 2400000),
  (2024, 2700000, 2550000),
  (2025, 2900000, 2800000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Activa Row Level Security (segurança dos dados)
-- ============================================================
ALTER TABLE escolas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE professores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE estatisticas_provinciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriculas_anuais    ENABLE ROW LEVEL SECURITY;

-- Política: leitura pública (o backend faz a autenticação)
CREATE POLICY "leitura_publica" ON estatisticas_provinciais FOR SELECT USING (true);
CREATE POLICY "leitura_publica" ON matriculas_anuais FOR SELECT USING (true);
CREATE POLICY "leitura_publica" ON escolas FOR SELECT USING (true);
CREATE POLICY "leitura_publica" ON alunos FOR SELECT USING (true);
CREATE POLICY "leitura_publica" ON professores FOR SELECT USING (true);
