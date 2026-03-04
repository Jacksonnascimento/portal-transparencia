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
    codigo_natureza VARCHAR(50), -- NOVO CAMPO: Código orçamental (Ex: 1.1.1.8.01.1.1)
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
    cpf VARCHAR(11) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ADMIN',
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserção do Administrador Padrão

INSERT INTO tb_usuario (nome, cpf, email, senha, role, ativo) 
VALUES (
    'Administrador do Sistema', 
    '01950964019', 
    'admin@horizon.com.br', 
    '$2a$10$2Y0Yx9Q42kfvxGQgeCnAzeKQvvX1M93NfwKSFfD.8OlsvCnFpZkJ.', 
    'ADMIN', 
    TRUE
)
ON CONFLICT (cpf) DO NOTHING;

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

-- Criação da Tabela
CREATE TABLE IF NOT EXISTS tb_configuracao_portal (
    id BIGINT PRIMARY KEY,
    nome_entidade VARCHAR(255),
    cnpj VARCHAR(20),
    url_brasao VARCHAR(255),
    cor_principal VARCHAR(7),
    endereco VARCHAR(255),
    telefone VARCHAR(20),
    horario_atendimento VARCHAR(100),
    site_oficial VARCHAR(255),
    diario_oficial VARCHAR(255),
    portal_contribuinte VARCHAR(255),
    facebook VARCHAR(255),
    instagram VARCHAR(255),
    twitter VARCHAR(255),
    -- Novos campos de Contato e Ouvidoria (LAI)
    email_entidade VARCHAR(255),
    link_ouvidoria VARCHAR(255),
    telefone_ouvidoria VARCHAR(20),
    email_ouvidoria VARCHAR(255),
	politica_privacidade TEXT,
    termos_uso TEXT
);


INSERT INTO tb_configuracao_portal (
    id, 
    nome_entidade, 
    cnpj, 
    cor_principal, 
    endereco, 
    telefone, 
    horario_atendimento,
    politica_privacidade,
    termos_uso
)
SELECT 
    1, 
    'Horizon Transparência', 
    '00.000.000/0001-00', 
    '#0F172A', 
    'Rua Exemplo, 123', 
    '(00) 0000-0000', 
    '08h às 14h',
    '1. Objetivo e Escopo
Esta Política de Privacidade estabelece o compromisso do Portal com a segurança e a proteção de dados pessoais, em estrita conformidade com a LGPD (Lei nº 13.709/2018).

2. Coleta de Dados
A navegação nas páginas de transparência ativa é pública e anônima. Dados pessoais são coletados estritamente quando o cidadão utiliza a Ouvidoria ou o e-SIC.

3. Uso e Compartilhamento
A Administração Pública não comercializa ou compartilha dados pessoais com entidades privadas, exceto por determinação judicial.

4. Direitos do Titular
O cidadão pode solicitar a confirmação, correção ou exclusão de seus dados pessoais armazenados nos canais de atendimento.',
    
    '1. Aceitação e Finalidade
Este portal visa assegurar o cumprimento da Lei de Acesso à Informação (LAI - Lei nº 12.527/2011), promovendo o controle social.

2. Dados Abertos
Todas as informações financeiras disponibilizadas são públicas. É permitido o uso e reprodução desses dados, desde que citada a fonte.

3. Responsabilidades do Usuário
O usuário compromete-se a utilizar as informações de forma ética. É proibida a utilização de scripts maliciosos que visem indisponibilizar a prestação de contas.

4. Disponibilidade
A Administração empenha-se em garantir a integridade dos dados e a disponibilidade do portal.'
WHERE NOT EXISTS (SELECT 1 FROM tb_configuracao_portal WHERE id = 1);


CREATE TABLE IF NOT EXISTS tb_faq (
    id BIGSERIAL PRIMARY KEY,
    pergunta VARCHAR(255) NOT NULL,
    resposta TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0
);


CREATE EXTENSION IF NOT EXISTS unaccent;

-- Criação da tabela de Serviços (Carta de Serviços ao Usuário)
CREATE TABLE IF NOT EXISTS tb_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    setor_responsavel VARCHAR(150) NOT NULL,
    requisitos TEXT NOT NULL,
    etapas TEXT NOT NULL,
    prazo_maximo VARCHAR(100) NOT NULL,
    forma_prestacao VARCHAR(50) NOT NULL,
    detalhes_prestacao TEXT NOT NULL,
    canais_manifestacao TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimizar as buscas no portal público
CREATE INDEX IF NOT EXISTS idx_servico_status ON tb_servico(status);
CREATE INDEX IF NOT EXISTS idx_servico_nome ON tb_servico(nome);


-- Criação da Tabela Dívida Ativa
CREATE TABLE IF NOT EXISTS tb_divida_ativa (
    id BIGSERIAL PRIMARY KEY,
    nome_devedor VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(20), -- Mascarado na aplicação/ingestão
    valor_total_divida DECIMAL(19,2) NOT NULL,
    ano_inscricao INT NOT NULL,
    tipo_divida VARCHAR(100),
    data_importacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_importacao VARCHAR(255)
);

-- Índices de performance para os filtros exigidos pelo PNTP
CREATE INDEX IF NOT EXISTS idx_divida_ano ON tb_divida_ativa(ano_inscricao);
CREATE INDEX IF NOT EXISTS idx_divida_nome ON tb_divida_ativa(nome_devedor);

-- =========================================================================
-- INSERÇÃO DE DADOS DE TESTE (SÉRIE HISTÓRICA: 2023, 2024, 2025)
-- =========================================================================


/*apagar depois*/
/*daqui*/
-- Injetando Histórico de Receitas (2023 a 2025)
INSERT INTO tb_receita (exercicio, mes, data_lancamento, codigo_natureza, categoria_economica, origem, especie, rubrica, alinea, fonte_recursos, valor_previsto_inicial, valor_previsto_atualizado, valor_arrecadado, historico) VALUES
(2025, 1, '2025-01-15', '1.1.1.8.01.1.1', 'Receitas Correntes', 'Impostos, Taxas e Contribuições', 'Impostos', 'IPTU', 'Principal', '1500 - Recursos Ordinários', 1500000.00, 1500000.00, 125000.50, 'Arrecadação de IPTU - Cota Única'),
(2025, 2, '2025-02-10', '1.1.1.8.02.3.1', 'Receitas Correntes', 'Impostos, Taxas e Contribuições', 'Impostos', 'ISSQN', 'Principal', '1500 - Recursos Ordinários', 2000000.00, 2000000.00, 180500.00, 'Arrecadação de ISSQN Retido'),
(2024, 6, '2024-06-20', '1.7.1.8.01.2.1', 'Receitas Correntes', 'Transferências Correntes', 'Transferências da União', 'FPM', 'Principal', '1500 - Recursos Ordinários', 5000000.00, 5200000.00, 480000.00, 'Repasse do Fundo de Participação dos Municípios'),
(2023, 11, '2023-11-05', '1.1.2.8.01.1.1', 'Receitas Correntes', 'Impostos, Taxas e Contribuições', 'Taxas', 'Taxa de Limpeza', 'Principal', '1500 - Recursos Ordinários', 300000.00, 300000.00, 25000.00, 'Arrecadação de Taxa de Coleta de Lixo');

-- Injetando Histórico de Dívida Ativa (2023 a 2025)
INSERT INTO tb_divida_ativa (nome_devedor, cpf_cnpj, valor_total_divida, ano_inscricao, tipo_divida) VALUES
('Empresa Alfa de Tecnologia Ltda', '22.167.816/0001-47', 45000.50, 2025, 'ISSQN'),
('Construtora Horizonte S/A', '61.682.179/0001-07', 125000.00, 2025, 'ISSQN - Construção Civil'),
('João Carlos da Silva', '61.682.179/0001-07', 1500.75, 2024, 'IPTU'),
('Maria Oliveira e Souza', '61.682.179/0001-07', 3450.00, 2024, 'IPTU'),
('Viação Rápida Logística', '54.561.688/0001-08', 12800.00, 2023, 'Multa Administrativa'),
('Pedro Paulo Santos', '16.543.203/0001-64', 850.00, 2023, 'Taxa de Alvará');

/*até aqui*/