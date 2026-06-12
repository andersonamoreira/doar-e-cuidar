-- ================================================================
-- Doar é Cuidar — Schema do Banco de Dados
-- Banco: dec
-- ================================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------
-- CATEGORIAS
-- ----------------------------------------------------------------
CREATE TABLE categorias (
    id   SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    emoji VARCHAR(10),
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- USUÁRIOS
-- ----------------------------------------------------------------
CREATE TABLE usuarios (
    id               SERIAL PRIMARY KEY,
    nome             VARCHAR(255) NOT NULL,
    email            VARCHAR(255) UNIQUE NOT NULL,
    senha_hash       VARCHAR(255) NOT NULL,
    tipo             VARCHAR(20)  DEFAULT 'ambos'
                         CHECK (tipo IN ('doador', 'receptor', 'ambos')),
    avatar_sigla     VARCHAR(2),
    cidade           VARCHAR(100),
    cep              VARCHAR(10),
    email_verificado BOOLEAN DEFAULT FALSE,
    ativo            BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- ITENS (doações)
-- ----------------------------------------------------------------
CREATE TABLE itens (
    id                 SERIAL PRIMARY KEY,
    titulo             VARCHAR(255) NOT NULL,
    descricao          TEXT,
    categoria_id       INTEGER REFERENCES categorias(id),
    estado_conservacao VARCHAR(50)
                           CHECK (estado_conservacao IN ('novo', 'otimo', 'bom', 'reparo')),
    cidade             VARCHAR(100),
    cep                VARCHAR(10),
    status             VARCHAR(20) DEFAULT 'disponivel'
                           CHECK (status IN ('disponivel', 'concluido', 'cancelado')),
    doador_id          INTEGER NOT NULL REFERENCES usuarios(id),
    beneficiario_id    INTEGER REFERENCES usuarios(id),
    created_at         TIMESTAMP DEFAULT NOW(),
    updated_at         TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- IMAGENS DOS ITENS
-- ----------------------------------------------------------------
CREATE TABLE imagens_item (
    id         SERIAL PRIMARY KEY,
    item_id    INTEGER NOT NULL REFERENCES itens(id) ON DELETE CASCADE,
    url        VARCHAR(500) NOT NULL,
    ordem      INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- CANDIDATURAS
-- ----------------------------------------------------------------
CREATE TABLE candidaturas (
    id           SERIAL PRIMARY KEY,
    item_id      INTEGER NOT NULL REFERENCES itens(id) ON DELETE CASCADE,
    usuario_id   INTEGER NOT NULL REFERENCES usuarios(id),
    justificativa TEXT NOT NULL,
    status       VARCHAR(20) DEFAULT 'pendente'
                     CHECK (status IN ('pendente', 'selecionado', 'rejeitado')),
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE (item_id, usuario_id)   -- um usuário só pode se candidatar uma vez por item
);

-- ----------------------------------------------------------------
-- NOTIFICAÇÕES
-- ----------------------------------------------------------------
CREATE TABLE notificacoes (
    id         SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    tipo       VARCHAR(50) NOT NULL,   -- 'candidatura_recebida' | 'selecionado' | 'rejeitado'
    mensagem   TEXT NOT NULL,
    item_id    INTEGER REFERENCES itens(id),
    lida       BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- ÍNDICES para performance
-- ----------------------------------------------------------------
CREATE INDEX idx_itens_status       ON itens(status);
CREATE INDEX idx_itens_categoria    ON itens(categoria_id);
CREATE INDEX idx_itens_doador       ON itens(doador_id);
CREATE INDEX idx_itens_cidade       ON itens(cidade);
CREATE INDEX idx_candidaturas_item  ON candidaturas(item_id);
CREATE INDEX idx_candidaturas_user  ON candidaturas(usuario_id);
CREATE INDEX idx_notif_usuario      ON notificacoes(usuario_id);
CREATE INDEX idx_notif_lida         ON notificacoes(lida);

-- ----------------------------------------------------------------
-- DADOS INICIAIS — Categorias
-- ----------------------------------------------------------------
INSERT INTO categorias (nome, emoji, slug) VALUES
    ('Móveis',           '🛋️', 'moveis'),
    ('Roupas',           '👗', 'roupas'),
    ('Eletrodomésticos', '🏠', 'eletrodomesticos'),
    ('Brinquedos',       '🧸', 'brinquedos'),
    ('Livros',           '📚', 'livros'),
    ('Outros',           '🔧', 'outros');
