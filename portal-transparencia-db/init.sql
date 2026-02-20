-- 1. Tabela de Credores
CREATE TABLE IF NOT EXISTS tb_credor (
    id BIGSERIAL PRIMARY KEY,
    cpf_cnpj VARCHAR(14) NOT NULL UNIQUE, 
    razao_social VARCHAR(255) NOT NULL,
    tipo_pessoa VARCHAR(10) CHECK (tipo_pessoa IN ('FISICA', 'JURIDICA'))
);

-- 2. Tabela de Receitas
CREATE TABLE IF NOT EXISTS tb_receita (
    id BIGSERIAL PRIMARY KEY,
    exercicio INT NOT NULL,
    mes INT NOT NULL,
    data_lancamento DATE,
    categoria_economica VARCHAR(100) NOT NULL,
    origem VARCHAR(100) NOT NULL,
    especie VARCHAR(100),
    rubrica VARCHAR(100),
    alinea VARCHAR(100),
    fonte_recursos VARCHAR(100) NOT NULL, 
    valor_previsto_inicial DECIMAL(19,2),
    valor_previsto_atualizado DECIMAL(19,2),
    valor_arrecadado DECIMAL(19,2) NOT NULL,
    historico TEXT,
	data_importacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id_importacao VARCHAR(255)
);

-- 3. Tabela de Despesas
CREATE TABLE IF NOT EXISTS tb_despesa (
    id BIGSERIAL PRIMARY KEY,
    exercicio INT NOT NULL,
    numero_empenho VARCHAR(20) NOT NULL,
    data_empenho DATE NOT NULL,
    orgao_codigo VARCHAR(10),
    orgao_nome VARCHAR(255),
    unidade_codigo VARCHAR(10),
    unidade_nome VARCHAR(255),
    funcao VARCHAR(100),
    subfuncao VARCHAR(100),
    programa VARCHAR(100),
    acao_governo VARCHAR(100),
    elemento_despesa VARCHAR(100),
    fonte_recursos VARCHAR(100),
    
    -- VINCULO COM CREDOR (CORRIGIDO PARA BIGINT)
    credor_id BIGINT REFERENCES tb_credor(id),
    
    valor_empenhado DECIMAL(19,2) DEFAULT 0,
    valor_liquidado DECIMAL(19,2) DEFAULT 0,
    valor_pago DECIMAL(19,2) DEFAULT 0,
    historico_objetivo TEXT, 
    modalidade_licitacao VARCHAR(100) 
);

-- Índices
CREATE INDEX idx_receita_exercicio ON tb_receita(exercicio);
CREATE INDEX idx_despesa_exercicio ON tb_despesa(exercicio);
CREATE INDEX idx_despesa_credor ON tb_despesa(credor_id);


CREATE TABLE IF NOT EXISTS tb_usuario (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ADMIN',
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserção do Administrador Padrão
-- A senha abaixo é o hash BCrypt válido para "admin123"
INSERT INTO tb_usuario (nome, email, senha, role, ativo) 
VALUES (
    'Administrador do Sistema', 
    'admin@horizon.com.br', 
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIvi', 
    'ADMIN', 
    TRUE
)
ON CONFLICT (email) DO NOTHING;


-- Criação da tabela de Logs de Auditoria (A "Caixa-Preta")
CREATE TABLE IF NOT EXISTS tb_log_auditoria (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT, -- Quem fez (pode ser nulo se for uma ação do sistema)
    usuario_nome VARCHAR(150), -- Nome gravado para histórico (caso o utilizador seja apagado)
    acao VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    entidade VARCHAR(100) NOT NULL, -- Ex: Receita, Usuario, Despesa
    entidade_id VARCHAR(100) NOT NULL, -- ID do registo que foi alterado
    dados_anteriores JSONB, -- Como estava antes (nulo se for INSERT)
    dados_novos JSONB, -- Como ficou (nulo se for DELETE)
    ip_origem VARCHAR(50), -- De onde o utilizador acedeu
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);