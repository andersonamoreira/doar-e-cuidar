# Documentação Técnica — Plataforma Doar é Cuidar

**Instituição:** Centro Universitário FAESA  
**Disciplina:** Projeto Integrador / Desenvolvimento de Sistemas  
**Ano:** 2026  
**Autor:** Anderson Moreira  
**URL de produção:** https://doarecuidar.com.br

---

## 1. Visão Geral do Projeto

**Doar é Cuidar** é uma plataforma web de doações que conecta pessoas que desejam doar itens usados (doadores) com pessoas que precisam desses itens (receptores). O sistema permite o cadastro de itens para doação com fotos, busca e filtragem por categoria e estado de conservação, candidatura de interessados, e seleção do beneficiário pelo doador.

### 1.1 Objetivos

- Facilitar a circulação de bens entre pessoas, reduzindo o descarte desnecessário
- Oferecer um processo transparente de candidatura e seleção
- Garantir rastreabilidade das doações via histórico de usuário
- Disponibilizar a plataforma 100% online e sem custo de acesso

### 1.2 Funcionalidades Implementadas

| Funcionalidade | Status |
|---|---|
| Cadastro e login de usuário (doador/receptor) | ✅ Implementado |
| Sessão persistente via JWT | ✅ Implementado |
| Feed público de doações com filtros | ✅ Implementado |
| Publicação de item com fotos reais | ✅ Implementado |
| Upload e armazenamento de fotos (até 5 por item) | ✅ Implementado |
| Visualização de detalhe do item com galeria | ✅ Implementado |
| Candidatura com justificativa | ✅ Implementado |
| Seleção de beneficiário pelo doador | ✅ Implementado |
| Encerrar doação publicada | ✅ Implementado |
| Editar dados de uma doação | ✅ Implementado |
| Painel do doador com histórico | ✅ Implementado |
| Perfil do usuário com estatísticas | ✅ Implementado |
| Notificações internas | ✅ Implementado |
| Dashboard administrativo | ✅ Implementado (estrutura) |

---

## 2. Arquitetura do Sistema

O sistema adota uma arquitetura em três camadas, totalmente conteinerizada com Docker:

```
                        INTERNET
                           │
                    ┌──────▼───────┐
                    │  Cloudflare  │  DNS + SSL (modo Flexible)
                    └──────┬───────┘
                           │ HTTP :80
                    ┌──────▼────────────────┐
                    │  camilassilvapsi-     │  Nginx principal do servidor
                    │  nginx-1              │  (proxy reverso multi-domínio)
                    └──────┬────────────────┘
                           │ rede: dec-web-shared
                    ┌──────▼───────┐
                    │  dec-nginx   │  Nginx da aplicação (porta interna)
                    └──┬───────┬───┘
                       │       │
          ┌────────────┘       └──────────────────┐
          │ /api/*                                 │ / e /uploads/
   ┌──────▼────────┐                    ┌──────────▼──────────┐
   │  dec-backend  │                    │  Arquivos estáticos │
   │  (Node.js)    │                    │  frontend/ + volume  │
   └──────┬────────┘                    │  doarecuidar_uploads│
          │ rede: dec-db-shared         └─────────────────────┘
   ┌──────▼────────┐
   │  PostgreSQL   │  (compartilhado com outros apps do servidor)
   └───────────────┘
```

### 2.1 Redes Docker

| Rede | Tipo | Finalidade |
|---|---|---|
| `dec-net` | bridge (interna) | Comunicação entre backend e dec-nginx |
| `dec-db-shared` | external | Acesso do backend ao PostgreSQL compartilhado |
| `dec-web-shared` | external | Acesso do nginx principal ao dec-nginx |

### 2.2 Volume Docker

| Volume | Montado em (backend) | Montado em (nginx) | Finalidade |
|---|---|---|---|
| `doarecuidar_uploads` | `/app/uploads` (leitura/escrita) | `/uploads` (somente leitura) | Armazenamento persistente das fotos dos itens |

---

## 3. Stack Tecnológica

### Frontend
| Tecnologia | Versão / Detalhe |
|---|---|
| HTML5 | SPA (Single Page Application) em arquivo único |
| CSS3 | Custom Properties, Grid, Flexbox — sem framework CSS |
| JavaScript | Vanilla ES2020+ (sem framework JS) |
| Comunicação | `fetch` API nativa com JSON e FormData |

### Backend
| Tecnologia | Versão |
|---|---|
| Node.js | 20 (LTS) |
| Express.js | ^4.19 |
| jsonwebtoken | ^9.0 |
| bcryptjs | ^2.4 |
| multer | ^2.0 |
| pg (node-postgres) | ^8.12 |
| dotenv | ^16.4 |

### Banco de Dados
| Tecnologia | Detalhe |
|---|---|
| PostgreSQL | Instância compartilhada no servidor |
| Banco | `dec` |
| Extensão | `uuid-ossp` |

### Infraestrutura
| Tecnologia | Detalhe |
|---|---|
| Docker | Conteinerização de backend e nginx |
| Docker Compose | Orquestração dos serviços |
| Nginx | 1.27-alpine (proxy reverso + arquivos estáticos) |
| Servidor | VPS Linux — IP 38.199.208.34 |
| DNS / CDN | Cloudflare (SSL Flexible) |
| Domínio | doarecuidar.com.br |

---

## 4. Estrutura de Diretórios

```
doar-e-cuidar/
│
├── frontend/
│   ├── index.html          # SPA completa (HTML + CSS + JS)
│   └── favicon.svg         # Ícone da plataforma (folhinha verde)
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js                      # Entry point / configuração Express
│       ├── config/
│       │   ├── db.js                   # Pool de conexão PostgreSQL
│       │   └── upload.js               # Configuração do Multer
│       ├── middleware/
│       │   ├── auth.js                 # Validação JWT
│       │   └── error.js                # Handler global de erros
│       ├── routes/
│       │   ├── auth.js
│       │   ├── itens.js
│       │   ├── candidaturas.js
│       │   ├── usuarios.js
│       │   └── categorias.js
│       └── controllers/
│           ├── auth.js
│           ├── itens.js
│           ├── uploads.js
│           ├── candidaturas.js
│           └── usuarios.js
│
├── database/
│   └── init.sql            # Schema completo + dados iniciais
│
├── nginx/
│   └── nginx.conf          # Configuração do dec-nginx
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── DOCUMENTACAO_TECNICA.md
```

---

## 5. Banco de Dados

### 5.1 Diagrama de Entidades e Relacionamentos

```
┌─────────────┐       ┌──────────────┐       ┌──────────────────┐
│  categorias │       │    itens     │       │   imagens_item   │
│─────────────│       │──────────────│       │──────────────────│
│ id (PK)     │◄──┐   │ id (PK)      │──────►│ id (PK)          │
│ nome        │   │   │ titulo       │       │ item_id (FK)     │
│ emoji       │   │   │ descricao    │       │ url              │
│ slug        │   └───│ categoria_id │       │ ordem            │
└─────────────┘       │ estado_cons. │       └──────────────────┘
                      │ cidade / cep │
                      │ status       │       ┌──────────────────┐
┌─────────────┐       │ doador_id(FK)│       │  candidaturas    │
│  usuarios   │       │ benefic._id  │       │──────────────────│
│─────────────│       └──────────────┘       │ id (PK)          │
│ id (PK)     │◄────────────────────────────►│ item_id (FK)     │
│ nome        │       ┌──────────────┐       │ usuario_id (FK)  │
│ email       │       │ notificacoes │       │ justificativa    │
│ senha_hash  │       │──────────────│       │ status           │
│ tipo        │◄──────│ usuario_id   │       └──────────────────┘
│ avatar_sigla│       │ tipo         │
│ cidade/cep  │       │ mensagem     │
│ ativo       │       │ item_id (FK) │
└─────────────┘       │ lida         │
                      └──────────────┘
```

### 5.2 Tabelas

#### `categorias`
| Campo | Tipo | Descrição |
|---|---|---|
| id | SERIAL PK | Identificador |
| nome | VARCHAR(100) | Ex: "Móveis" |
| emoji | VARCHAR(10) | Ex: "🛋️" |
| slug | VARCHAR(100) UNIQUE | Ex: "moveis" |

**Dados iniciais:** Móveis, Roupas, Eletrodomésticos, Brinquedos, Livros, Outros.

---

#### `usuarios`
| Campo | Tipo | Restrição |
|---|---|---|
| id | SERIAL PK | — |
| nome | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | UNIQUE NOT NULL |
| senha_hash | VARCHAR(255) | NOT NULL (bcrypt, 10 rounds) |
| tipo | VARCHAR(20) | CHECK: `doador`, `receptor`, `ambos` |
| avatar_sigla | VARCHAR(2) | Iniciais do nome (geradas automaticamente) |
| cidade | VARCHAR(100) | — |
| cep | VARCHAR(10) | — |
| email_verificado | BOOLEAN | DEFAULT false |
| ativo | BOOLEAN | DEFAULT true |

---

#### `itens`
| Campo | Tipo | Restrição |
|---|---|---|
| id | SERIAL PK | — |
| titulo | VARCHAR(255) | NOT NULL |
| descricao | TEXT | — |
| categoria_id | INTEGER FK | → categorias |
| estado_conservacao | VARCHAR(50) | CHECK: `novo`, `otimo`, `bom`, `reparo` |
| cidade | VARCHAR(100) | — |
| cep | VARCHAR(10) | — |
| status | VARCHAR(20) | CHECK: `disponivel`, `concluido`, `cancelado` |
| doador_id | INTEGER FK | → usuarios NOT NULL |
| beneficiario_id | INTEGER FK | → usuarios (preenchido ao concluir) |

---

#### `imagens_item`
| Campo | Tipo | Descrição |
|---|---|---|
| id | SERIAL PK | — |
| item_id | INTEGER FK | → itens ON DELETE CASCADE |
| url | VARCHAR(500) | Caminho: `/uploads/nome_arquivo.ext` |
| ordem | INTEGER | Ordem de exibição |

---

#### `candidaturas`
| Campo | Tipo | Restrição |
|---|---|---|
| id | SERIAL PK | — |
| item_id | INTEGER FK | → itens ON DELETE CASCADE |
| usuario_id | INTEGER FK | → usuarios |
| justificativa | TEXT | Mínimo 20 caracteres |
| status | VARCHAR(20) | CHECK: `pendente`, `selecionado`, `rejeitado` |
| — | UNIQUE | (item_id, usuario_id) — um usuário por item |

---

#### `notificacoes`
| Campo | Tipo | Descrição |
|---|---|---|
| id | SERIAL PK | — |
| usuario_id | INTEGER FK | Destinatário |
| tipo | VARCHAR(50) | `candidatura_recebida`, `selecionado`, `rejeitado` |
| mensagem | TEXT | Texto exibido |
| item_id | INTEGER FK | Item relacionado |
| lida | BOOLEAN | DEFAULT false |

---

## 6. API REST

**Base URL:** `https://doarecuidar.com.br/api`

### 6.1 Autenticação

Rotas protegidas exigem o header:
```
Authorization: Bearer <token_jwt>
```
O token tem validade de **7 dias** e é gerado com `jsonwebtoken` usando o `JWT_SECRET` do ambiente.

---

### 6.2 Endpoints

#### Autenticação — `/api/auth`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/register` | Não | Cadastrar novo usuário |
| POST | `/auth/login` | Não | Login — retorna token |
| GET | `/auth/me` | Sim | Dados do usuário autenticado |

**POST /auth/register — Body:**
```json
{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "senha": "minimo8chars",
  "tipo": "ambos"
}
```
**Resposta 201:**
```json
{
  "user": { "id": 1, "nome": "Maria Silva", "avatar_sigla": "MS", ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**POST /auth/login — Body:**
```json
{ "email": "maria@email.com", "senha": "minimo8chars" }
```
**Resposta 200:** mesmo formato do register.

---

#### Itens — `/api/itens`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/itens` | Não | Listar itens disponíveis (com filtros) |
| GET | `/itens/meus` | Sim | Itens do doador autenticado |
| GET | `/itens/:id` | Não | Detalhe do item + array de imagens |
| POST | `/itens` | Sim | Criar novo item |
| PUT | `/itens/:id` | Sim | Editar item (apenas o próprio doador) |
| PATCH | `/itens/:id/encerrar` | Sim | Cancelar item |
| POST | `/itens/:id/imagens` | Sim | Upload de foto (multipart/form-data) |
| DELETE | `/itens/:id/imagens/:imgId` | Sim | Remover foto |

**GET /itens — Query params opcionais:**

| Param | Tipo | Exemplo |
|---|---|---|
| cat | string | `moveis` |
| estado | string | `novo` |
| cidade | string | `Vila Velha` |
| q | string | `sofá` (busca título e descrição) |
| sort | string | `recentes` \| `candidatos` \| `az` |

**GET /itens/:id — Resposta:**
```json
{
  "id": 1,
  "titulo": "Sofá 3 lugares",
  "descricao": "...",
  "estado_conservacao": "bom",
  "cidade": "Vila Velha",
  "status": "disponivel",
  "categoria_nome": "Móveis",
  "categoria_emoji": "🛋️",
  "doador_nome": "João Silva",
  "doador_sigla": "JS",
  "total_candidatos": 3,
  "imagens": [
    { "id": 1, "url": "/uploads/abc123.jpg", "ordem": 0 },
    { "id": 2, "url": "/uploads/def456.webp", "ordem": 1 }
  ]
}
```

**POST /itens/:id/imagens — multipart/form-data:**
- Campo: `foto`
- Formatos aceitos: JPG, JPEG, PNG, WEBP
- Tamanho máximo: 8 MB por arquivo
- Limite: 5 imagens por item

---

#### Candidaturas — `/api/candidaturas`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/candidaturas/minhas` | Sim | Candidaturas do usuário |
| GET | `/candidaturas/item/:itemId` | Sim (doador) | Candidaturas de um item |
| POST | `/candidaturas` | Sim | Candidatar a um item |
| PATCH | `/candidaturas/:id/selecionar` | Sim (doador) | Selecionar beneficiário |

**POST /candidaturas — Body:**
```json
{ "item_id": 1, "justificativa": "Preciso deste item porque..." }
```
Ao selecionar um beneficiário (`PATCH /selecionar`), o sistema automaticamente:
- Marca o item com `status = 'concluido'`
- Rejeita as demais candidaturas (`status = 'rejeitado'`)
- Envia notificação interna ao selecionado

---

#### Usuários — `/api/usuarios`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/usuarios/perfil` | Sim | Dados do perfil |
| PUT | `/usuarios/perfil` | Sim | Atualizar nome, cidade, CEP |
| GET | `/usuarios/estatisticas` | Sim | Doações realizadas, recebidas, candidaturas |
| GET | `/usuarios/notificacoes` | Sim | Últimas 50 notificações |
| PATCH | `/usuarios/notificacoes/lidas` | Sim | Marcar todas como lidas |

---

#### Categorias — `/api/categorias`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/categorias` | Não | Lista todas as categorias |

---

#### Health Check

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Verifica se a API está no ar |

**Resposta:** `{ "status": "ok", "ts": "2026-06-13T00:00:00.000Z" }`

---

## 7. Autenticação e Segurança

### 7.1 Fluxo de Autenticação

```
Cliente                         Backend
  │                               │
  │  POST /auth/register          │
  │  { nome, email, senha, tipo } │
  │──────────────────────────────►│
  │                               │ bcrypt.hash(senha, 10)
  │                               │ INSERT INTO usuarios
  │                               │ jwt.sign({ id }, secret, 7d)
  │◄──────────────────────────────│
  │  { user, token }              │
  │                               │
  │  localStorage.setItem(        │
  │    'dec_token', token)        │
  │                               │
  │  GET /auth/me                 │
  │  Authorization: Bearer token  │
  │──────────────────────────────►│
  │                               │ jwt.verify(token, secret)
  │                               │ SELECT * FROM usuarios WHERE id=?
  │◄──────────────────────────────│
  │  { id, nome, email, tipo... } │
```

### 7.2 Práticas de Segurança

| Prática | Implementação |
|---|---|
| Hash de senhas | bcryptjs com 10 rounds de salt |
| Autenticação stateless | JWT com expiração de 7 dias |
| Autorização por recurso | Queries com `AND doador_id = req.userId` |
| Nomes de arquivo randômicos | `crypto.randomBytes(16).toString('hex')` — evita enumeração |
| Limite de tamanho de upload | 8 MB por arquivo (Multer + Nginx) |
| Validação de tipo de arquivo | Filtro por extensão no Multer |
| Sem dados sensíveis no token | JWT contém apenas `{ id }` |
| Senhas nunca retornadas | `senha_hash` excluída em todas as queries de leitura |
| SQL Injection | Prevenido com queries parametrizadas (`$1`, `$2`...) |

---

## 8. Upload e Armazenamento de Fotos

### 8.1 Fluxo de Upload

```
Frontend                     Backend (dec-backend)        Disco
   │                               │                        │
   │  1. Usuário seleciona fotos   │                        │
   │     (input type=file)         │                        │
   │                               │                        │
   │  2. POST /api/itens (JSON)    │                        │
   │──────────────────────────────►│                        │
   │◄──────────────────────────────│                        │
   │  { id: 42, ... }              │                        │
   │                               │                        │
   │  3. Para cada foto:           │                        │
   │  POST /api/itens/42/imagens   │                        │
   │  Content-Type: multipart/...  │                        │
   │  campo: "foto"                │                        │
   │──────────────────────────────►│                        │
   │                               │ multer salva arquivo   │
   │                               │──────────────────────►│
   │                               │ /app/uploads/abc.webp  │
   │                               │                        │
   │                               │ INSERT INTO imagens_item
   │                               │ url = '/uploads/abc.webp'
   │◄──────────────────────────────│                        │
   │  { id, url, ordem }           │                        │
```

### 8.2 Serving das Fotos

As fotos são servidas diretamente pelo Nginx, sem passar pelo backend Node.js:

```
https://doarecuidar.com.br/uploads/abc123.webp
                                │
                        dec-nginx serve do volume
                        doarecuidar_uploads montado em /uploads
                        Cache-Control: public, max-age=2592000
```

---

## 9. Configurações de Ambiente

### 9.1 Variáveis de Ambiente (`.env`)

| Variável | Exemplo | Descrição |
|---|---|---|
| `DB_HOST` | `camilassilvapsi-db-1` | Hostname do PostgreSQL |
| `DB_PORT` | `5432` | Porta padrão PostgreSQL |
| `DB_NAME` | `dec` | Nome do banco |
| `DB_USER` | `postgres` | Usuário do banco |
| `DB_PASSWORD` | `***` | Senha do banco |
| `JWT_SECRET` | `string aleatória longa` | Chave de assinatura JWT |
| `PORT` | `3000` | Porta do servidor Node.js |

### 9.2 Nginx — Configuração Principal

```nginx
server {
    listen 80;
    server_name doarecuidar.com.br www.doarecuidar.com.br;
    client_max_body_size 20m;

    location /uploads/ {            # fotos: servidas do volume Docker
        alias /uploads/;
        expires 30d;
    }

    location / {                    # frontend SPA
        try_files $uri $uri/ /index.html;
    }

    location /api/ {                # proxy para Node.js
        proxy_pass http://backend:3000;
    }
}
```

---

## 10. Frontend — Estrutura e Telas

O frontend é uma **Single Page Application (SPA)** em arquivo único (`index.html`), sem framework. A navegação é feita por JavaScript, mostrando/ocultando seções.

### 10.1 Telas Disponíveis

| ID da tela | Acesso | Descrição |
|---|---|---|
| `landing` | Público | Página inicial com hero, estatísticas e cards de prévia |
| `feed` | Público | Feed completo com busca e filtros |
| `detalhe` | Público | Detalhe do item com galeria de fotos |
| `auth` | Público | Formulários de login e cadastro |
| `publicar` | Logado | Wizard 3 passos para publicar doação |
| `painel` | Logado | Painel do doador com seus anúncios |
| `perfil` | Logado | Perfil e histórico de candidaturas |
| `dashboard` | Logado | KPIs e atividade da plataforma |

### 10.2 Gerenciamento de Estado

```javascript
// Estado global da aplicação
let token    = localStorage.getItem('dec_token') || null;
let usuario  = null;           // objeto do usuário autenticado
let categoriasMap = {};        // id → { id, nome, emoji, slug }
let itemAtual     = null;      // item sendo visualizado
let fotosParaEnviar = [];      // arquivos selecionados para upload
```

### 10.3 Comunicação com a API

Toda comunicação usa uma função utilitária centralizada:

```javascript
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res  = await fetch('/api' + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ' + res.status);
  return data;
}
```

Uploads de foto usam `fetch` com `FormData` diretamente (sem a função `api`), pois não se define `Content-Type` manualmente no multipart.

### 10.4 Design System

O CSS usa **Custom Properties** (variáveis CSS) como design tokens:

| Variável | Valor | Uso |
|---|---|---|
| `--verde` | `#1B7A4A` | Cor primária |
| `--verde2` | `#2E9D63` | Verde hover |
| `--verde3` | `#E8F5EE` | Verde claro (fundo) |
| `--terra` | `#B5451B` | Alertas e encerrar |
| `--preto` | `#1A1A18` | Textos principais |
| `--fonte` | `'Playfair Display'` | Títulos |
| `--fonte2` | `'Inter'` | Corpo |

---

## 11. Docker e Deploy

### 11.1 Docker Compose

```yaml
services:
  backend:                         # API Node.js
    build: ./backend
    container_name: dec-backend
    volumes:
      - uploads:/app/uploads       # persiste fotos
    networks:
      - dec-net
      - dec-db-shared

  nginx:                           # Servidor web
    image: nginx:1.27-alpine
    container_name: dec-nginx
    volumes:
      - ./frontend:/usr/share/nginx/html:ro
      - uploads:/uploads:ro        # serve fotos diretamente
    networks:
      - dec-net
      - dec-web-shared

volumes:
  uploads:                         # volume nomeado — persiste reinicializações
```

### 11.2 Dockerfile do Backend

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev         # sem devDependencies em produção
COPY src/ ./src/
EXPOSE 3000
CMD ["node", "src/app.js"]
```

### 11.3 Processo de Deploy

1. Desenvolver localmente e fazer commit/push para o GitHub
2. No servidor: `cd /opt/doarecuidar && git pull`
3. Para mudanças de backend: `docker compose up -d --build --no-deps backend`
4. Para mudanças de frontend: apenas o `git pull` já é suficiente (volume montado `:ro`)
5. Para mudanças de nginx: `docker compose up -d --no-deps nginx` + reconectar à rede

---

## 12. Dependências do Projeto

### Backend (`package.json`)

```json
{
  "dependencies": {
    "bcryptjs":    "^2.4.3",   // hash de senhas
    "cors":        "^2.8.5",   // headers CORS
    "dotenv":      "^16.4.5",  // variáveis de ambiente
    "express":     "^4.19.2",  // framework HTTP
    "jsonwebtoken":"^9.0.2",   // autenticação JWT
    "multer":      "^2.0.0",   // upload de arquivos multipart
    "pg":          "^8.12.0"   // client PostgreSQL
  },
  "devDependencies": {
    "nodemon":     "^3.1.4"    // hot-reload em desenvolvimento
  }
}
```

### Frontend

Não possui dependências de pacotes. Utiliza apenas:
- **Google Fonts** (Playfair Display + Inter) via CDN
- APIs nativas do navegador (`fetch`, `localStorage`, `FormData`, `URL.createObjectURL`)

---

## 13. Modelo de Negócio e Fluxos Principais

### Fluxo de Doação Completo

```
Doador                          Sistema                         Receptor
  │                               │                               │
  │  1. Cadastra item             │                               │
  │     (título, categoria,       │                               │
  │      estado, fotos)           │                               │
  │──────────────────────────────►│                               │
  │                               │  Item status: 'disponivel'    │
  │                               │                               │
  │                               │◄──────────────────────────────│
  │                               │  2. Receptor se candidata     │
  │                               │     com justificativa         │
  │                               │                               │
  │◄──────────────────────────────│                               │
  │  3. Recebe notificação        │                               │
  │     de candidatura            │                               │
  │                               │                               │
  │  4. Visualiza candidaturas    │                               │
  │     e seleciona beneficiário  │                               │
  │──────────────────────────────►│                               │
  │                               │  Item status: 'concluido'     │
  │                               │  Outros candidatos: rejeitado │
  │                               │                               │
  │                               │──────────────────────────────►│
  │                               │  5. Notificação de seleção    │
```

---

## 14. Limitações Atuais e Evoluções Previstas

| Item | Status | Observação |
|---|---|---|
| Verificação de e-mail | Não implementado | Campo `email_verificado` existe no banco |
| Chat entre doador e receptor | Não implementado | Necessário para combinar entrega |
| Busca geográfica (raio em km) | Não implementado | Filtro atual é por nome de cidade |
| Moderação de anúncios | Não implementado | Qualquer conteúdo pode ser publicado |
| Avaliação pós-doação | Não implementado | Melhoraria confiança na plataforma |
| App mobile | Não implementado | API REST já está preparada para consumo |
| Estatísticas do dashboard | Parcial | Estrutura existe, falta endpoint de admin |

---

*Documentação gerada em 13 de junho de 2026.*
