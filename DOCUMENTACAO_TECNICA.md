# Documentação Técnica — Plataforma Doar é Cuidar

**Instituição:** Centro Universitário FAESA  
**Disciplina:** Projeto Integrador III  
**Ano:** 2026  
**Autores:** Anderson Moreira, Bruna Soares, Mayara Hafez  
**URL de produção:** https://doarecuidar.com.br  
**Repositório:** GitHub (privado)  
**Servidor:** VPS Linux — 38.199.208.34

---

## 1. Visão Geral

**Doar é Cuidar** é uma plataforma web de doações que conecta pessoas que desejam doar itens com pessoas que precisam recebê-los. Todo o processo — cadastro, publicação, candidatura e seleção do beneficiário — ocorre de forma online, sem intermediários.

O sistema está completamente funcional em produção, com banco de dados real, autenticação por JWT, upload de fotos armazenadas em servidor e domínio próprio com HTTPS via Cloudflare.

---

## 2. Stack Tecnológica Atual

### Frontend
| Tecnologia | Detalhes |
|---|---|
| HTML5 | Estrutura das telas e formulários |
| CSS3 | Design system com Custom Properties, Grid, Flexbox, media queries |
| JavaScript (ES2020+) | Vanilla JS puro — sem nenhum framework |
| Google Fonts (CDN) | Sora (títulos) + DM Sans (corpo) |
| Fetch API | Comunicação assíncrona com o backend |
| FormData API | Envio de arquivos (upload de fotos) |
| localStorage | Persistência do token JWT no navegador |

### Backend
| Tecnologia | Versão | Finalidade |
|---|---|---|
| Node.js | 20 LTS | Runtime JavaScript no servidor |
| Express.js | ^4.19 | Framework HTTP e roteamento |
| jsonwebtoken | ^9.0 | Geração e validação de tokens JWT |
| bcryptjs | ^2.4 | Hash de senhas com salt |
| multer | ^2.0 | Recebimento e armazenamento de fotos (multipart) |
| pg (node-postgres) | ^8.12 | Driver de conexão com PostgreSQL |
| dotenv | ^16.4 | Carregamento de variáveis de ambiente |

### Banco de Dados
| Tecnologia | Detalhes |
|---|---|
| PostgreSQL | Banco relacional; instância compartilhada no servidor de produção |
| Banco | `dec` |
| Extensão ativa | `uuid-ossp` |

### Infraestrutura
| Tecnologia | Detalhes |
|---|---|
| Docker | Conteinerização dos serviços |
| Docker Compose | Orquestração: backend + nginx |
| Nginx 1.27 (Alpine) | Proxy reverso, arquivos estáticos, serving das fotos |
| Cloudflare | DNS autoritativo, CDN e terminação SSL (modo Flexible) |
| VPS Linux | Servidor de produção — todas as peças rodam aqui |
| Git + GitHub | Versionamento; deploy por `git pull` no servidor |

---

## 3. Arquitetura Completa

```
                         INTERNET
                            │
                   ┌────────▼─────────┐
                   │   Cloudflare      │
                   │  DNS + SSL/HTTPS  │
                   └────────┬─────────┘
                            │ HTTP :80
               ┌────────────▼──────────────────┐
               │   camilassilvapsi-nginx-1      │
               │   Nginx principal do servidor  │
               │   (proxy reverso multi-domínio)│
               └────────────┬──────────────────┘
                            │ rede Docker: dec-web-shared
               ┌────────────▼──────────┐
               │      dec-nginx        │
               │   Nginx da aplicação  │
               └──────┬──────────┬─────┘
                      │          │
          ┌───────────┘          └──────────────────────┐
     /api/*                    / (frontend) e /uploads/ (fotos)
          │
  ┌───────▼──────────┐         ┌──────────────────────────────┐
  │   dec-backend    │         │  Volume: doarecuidar_uploads  │
  │   Node.js :3000  │         │  Fotos persistidas no disco   │
  └───────┬──────────┘         └──────────────────────────────┘
          │ rede Docker: dec-db-shared
  ┌───────▼──────────┐
  │   PostgreSQL     │
  │   banco: dec     │
  └──────────────────┘
```

### Redes Docker

| Rede | Tipo | Conecta |
|---|---|---|
| `dec-net` | bridge interna | dec-backend ↔ dec-nginx |
| `dec-db-shared` | external | dec-backend ↔ PostgreSQL |
| `dec-web-shared` | external | dec-nginx ↔ nginx principal |

### Volume Docker

| Volume | Backend | Nginx |
|---|---|---|
| `doarecuidar_uploads` | `/app/uploads` (escrita) | `/uploads` (somente leitura) |

---

## 4. Estrutura de Arquivos do Projeto

```
doar-e-cuidar/
│
├── frontend/
│   ├── index.html              ← SPA completa: HTML + CSS + JavaScript
│   └── favicon.svg             ← Ícone da plataforma (folhinha verde SVG)
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js              ← Entry point Express: rotas + middleware
│       ├── config/
│       │   ├── db.js           ← Pool de conexão PostgreSQL
│       │   └── upload.js       ← Configuração Multer (destino, filtro, limite)
│       ├── middleware/
│       │   ├── auth.js         ← Validação do token JWT em rotas protegidas
│       │   └── error.js        ← Handler global de erros HTTP 500
│       ├── routes/
│       │   ├── auth.js         ← /api/auth/*
│       │   ├── itens.js        ← /api/itens/*
│       │   ├── candidaturas.js ← /api/candidaturas/*
│       │   ├── usuarios.js     ← /api/usuarios/*
│       │   └── categorias.js   ← /api/categorias
│       └── controllers/
│           ├── auth.js         ← register, login, me
│           ├── itens.js        ← listar, buscar, criar, atualizar, encerrar, meusPorDoador
│           ├── uploads.js      ← subirImagem, removerImagem
│           ├── candidaturas.js ← listarPorItem, minhasCandidaturas, candidatar, selecionar
│           └── usuarios.js     ← perfil, atualizar, estatisticas, notificacoes, marcarNotifLida
│
├── database/
│   └── init.sql                ← Schema completo + índices + dados iniciais
│
├── nginx/
│   └── nginx.conf              ← Configuração do dec-nginx
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── DOCUMENTACAO_TECNICA.md
```

---

## 5. Banco de Dados

### 5.1 Diagrama Entidade-Relacionamento

```
┌──────────────┐         ┌──────────────────┐       ┌──────────────────┐
│  categorias  │         │      itens        │       │  imagens_item    │
│──────────────│         │──────────────────│       │──────────────────│
│ id (PK)      │◄────────│ id (PK)           │──────►│ id (PK)          │
│ nome         │  cat_id │ titulo            │       │ item_id (FK)     │
│ emoji        │         │ descricao         │       │ url  (/uploads/) │
│ slug         │         │ estado_conservacao│       │ ordem            │
└──────────────┘         │ cidade / cep      │       └──────────────────┘
                         │ status            │
                         │ doador_id (FK)    │       ┌──────────────────┐
┌──────────────┐         │ beneficiario_id   │       │   candidaturas   │
│   usuarios   │◄────────│──────────────────│       │──────────────────│
│──────────────│         └──────────────────┘       │ id (PK)          │
│ id (PK)      │                                ┌───►│ item_id (FK)     │
│ nome         │◄───────────────────────────────┘   │ usuario_id (FK)  │
│ email        │                                     │ justificativa    │
│ senha_hash   │       ┌──────────────────┐          │ status           │
│ tipo         │       │  notificacoes    │          └──────────────────┘
│ avatar_sigla │◄──────│ usuario_id (FK)  │
│ cidade / cep │       │ tipo             │
│ ativo        │       │ mensagem         │
└──────────────┘       │ item_id (FK)     │
                       │ lida             │
                       └──────────────────┘
```

### 5.2 Tabelas

#### `categorias` — categorias de itens
| Campo | Tipo | Detalhe |
|---|---|---|
| id | SERIAL PK | — |
| nome | VARCHAR(100) | Ex: "Móveis" |
| emoji | VARCHAR(10) | Ex: "🛋️" |
| slug | VARCHAR(100) UNIQUE | Ex: "moveis" — usado em filtros de URL |

**Dados pré-carregados:** Móveis 🛋️, Roupas 👗, Eletrodomésticos 🏠, Brinquedos 🧸, Livros 📚, Outros 🔧

---

#### `usuarios` — contas de usuários
| Campo | Tipo | Restrição |
|---|---|---|
| id | SERIAL PK | — |
| nome | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | UNIQUE NOT NULL |
| senha_hash | VARCHAR(255) | bcrypt 10 rounds — nunca retornada na API |
| tipo | VARCHAR(20) | CHECK: `doador` / `receptor` / `ambos` |
| avatar_sigla | VARCHAR(2) | Gerada automaticamente das iniciais do nome |
| cidade | VARCHAR(100) | Opcional |
| cep | VARCHAR(10) | Opcional |
| email_verificado | BOOLEAN | DEFAULT false |
| ativo | BOOLEAN | DEFAULT true |
| created_at / updated_at | TIMESTAMP | — |

---

#### `itens` — doações publicadas
| Campo | Tipo | Restrição |
|---|---|---|
| id | SERIAL PK | — |
| titulo | VARCHAR(255) | NOT NULL |
| descricao | TEXT | — |
| categoria_id | FK | → categorias |
| estado_conservacao | VARCHAR(50) | CHECK: `novo` / `otimo` / `bom` / `reparo` |
| cidade | VARCHAR(100) | — |
| cep | VARCHAR(10) | — |
| status | VARCHAR(20) | CHECK: `disponivel` / `concluido` / `cancelado` |
| doador_id | FK | → usuarios NOT NULL |
| beneficiario_id | FK | → usuarios (preenchido ao concluir) |

---

#### `imagens_item` — fotos dos itens
| Campo | Tipo | Detalhe |
|---|---|---|
| id | SERIAL PK | — |
| item_id | FK | → itens ON DELETE CASCADE |
| url | VARCHAR(500) | Caminho `/uploads/nome_aleatorio.ext` |
| ordem | INTEGER | Ordem de exibição na galeria |

---

#### `candidaturas` — interesse em receber um item
| Campo | Tipo | Restrição |
|---|---|---|
| id | SERIAL PK | — |
| item_id | FK | → itens ON DELETE CASCADE |
| usuario_id | FK | → usuarios |
| justificativa | TEXT | Mínimo 20 caracteres |
| status | VARCHAR(20) | CHECK: `pendente` / `selecionado` / `rejeitado` |
| — | UNIQUE | (item_id, usuario_id) — um usuário só pode candidatar uma vez por item |

---

#### `notificacoes` — avisos internos
| Campo | Tipo | Detalhe |
|---|---|---|
| id | SERIAL PK | — |
| usuario_id | FK | Destinatário |
| tipo | VARCHAR(50) | `candidatura_recebida` / `selecionado` / `rejeitado` |
| mensagem | TEXT | Texto exibido ao usuário |
| item_id | FK | Item relacionado |
| lida | BOOLEAN | DEFAULT false |

### 5.3 Índices criados

```sql
CREATE INDEX idx_itens_status      ON itens(status);
CREATE INDEX idx_itens_categoria   ON itens(categoria_id);
CREATE INDEX idx_itens_doador      ON itens(doador_id);
CREATE INDEX idx_itens_cidade      ON itens(cidade);
CREATE INDEX idx_candidaturas_item ON candidaturas(item_id);
CREATE INDEX idx_candidaturas_user ON candidaturas(usuario_id);
CREATE INDEX idx_notif_usuario     ON notificacoes(usuario_id);
CREATE INDEX idx_notif_lida        ON notificacoes(lida);
```

---

## 6. API REST

**Base URL em produção:** `https://doarecuidar.com.br/api`

Rotas protegidas exigem o header:
```
Authorization: Bearer <token_jwt>
```

### 6.1 Autenticação — `/api/auth`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/register` | Não | Cadastrar usuário |
| POST | `/auth/login` | Não | Login — retorna token JWT |
| GET | `/auth/me` | Sim | Dados do usuário logado |

**POST /auth/register**
```json
// Body
{ "nome": "Maria Silva", "email": "maria@email.com", "senha": "minimo8chars", "tipo": "ambos" }

// Resposta 201
{ "user": { "id": 1, "nome": "Maria Silva", "avatar_sigla": "MS", "tipo": "ambos" }, "token": "eyJ..." }
```

**POST /auth/login**
```json
// Body
{ "email": "maria@email.com", "senha": "minimo8chars" }

// Resposta 200 — mesmo formato do register
```

---

### 6.2 Itens — `/api/itens`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/itens` | Não | Listar itens disponíveis com filtros |
| GET | `/itens/meus` | Sim | Itens publicados pelo usuário logado |
| GET | `/itens/:id` | Não | Detalhe do item + array de imagens |
| POST | `/itens` | Sim | Publicar novo item |
| PUT | `/itens/:id` | Sim | Editar item (somente o próprio doador) |
| PATCH | `/itens/:id/encerrar` | Sim | Cancelar item (status → `cancelado`) |
| POST | `/itens/:id/imagens` | Sim | Upload de foto (multipart/form-data) |
| DELETE | `/itens/:id/imagens/:imgId` | Sim | Remover foto do item |

**GET /itens — Query parameters:**

| Parâmetro | Exemplo | Descrição |
|---|---|---|
| q | `sofá` | Busca no título e descrição |
| cat | `moveis` | Filtro por slug da categoria |
| estado | `novo` | Filtro por estado de conservação |
| cidade | `Vila Velha` | Filtro por cidade (ILIKE) |
| sort | `recentes` | Ordenação: `recentes` / `candidatos` / `az` |

**GET /itens/:id — Resposta:**
```json
{
  "id": 1,
  "titulo": "Sofá 3 lugares bege",
  "descricao": "Em ótimo estado, sem manchas.",
  "estado_conservacao": "otimo",
  "cidade": "Vila Velha",
  "status": "disponivel",
  "categoria_nome": "Móveis",
  "categoria_emoji": "🛋️",
  "doador_nome": "João Silva",
  "doador_sigla": "JS",
  "total_candidatos": 3,
  "imagens": [
    { "id": 1, "url": "/uploads/abc123def.webp", "ordem": 0 },
    { "id": 2, "url": "/uploads/xyz456ghi.jpg",  "ordem": 1 }
  ]
}
```

**POST /itens/:id/imagens:**
- Content-Type: `multipart/form-data`
- Campo do arquivo: `foto`
- Formatos aceitos: JPG, JPEG, PNG, WEBP
- Tamanho máximo: 8 MB por arquivo
- Limite por item: 5 fotos

---

### 6.3 Candidaturas — `/api/candidaturas`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/candidaturas/minhas` | Sim | Candidaturas feitas pelo usuário logado |
| GET | `/candidaturas/item/:itemId` | Sim (doador) | Candidaturas recebidas por um item |
| POST | `/candidaturas` | Sim | Candidatar-se a um item |
| PATCH | `/candidaturas/:id/selecionar` | Sim (doador) | Selecionar beneficiário |

**POST /candidaturas**
```json
// Body
{ "item_id": 1, "justificativa": "Preciso deste item porque..." }
```

Ao selecionar (`PATCH /selecionar`), o sistema automaticamente:
1. Define o item como `status = 'concluido'`
2. Marca as demais candidaturas como `rejeitado`
3. Cria notificação interna para o selecionado

---

### 6.4 Usuários — `/api/usuarios`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/usuarios/perfil` | Sim | Dados do perfil |
| PUT | `/usuarios/perfil` | Sim | Atualizar nome, cidade e CEP |
| GET | `/usuarios/estatisticas` | Sim | Doações realizadas, recebidas, candidaturas |
| GET | `/usuarios/notificacoes` | Sim | Últimas 50 notificações |
| PATCH | `/usuarios/notificacoes/lidas` | Sim | Marcar todas como lidas |

---

### 6.5 Categorias — `/api/categorias`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/categorias` | Não | Lista todas as categorias com emoji e slug |

---

### 6.6 Health Check

| Método | Rota | Resposta |
|---|---|---|
| GET | `/health` | `{ "status": "ok", "ts": "2026-06-13T..." }` |

---

## 7. Autenticação e Segurança

### 7.1 Fluxo de Login / Cadastro

```
1. Usuário preenche formulário no frontend
2. Frontend faz POST /api/auth/login (ou /register) com JSON
3. Backend valida credenciais / cria conta
4. Backend gera JWT assinado com JWT_SECRET (validade: 7 dias)
5. Frontend recebe { user, token } e salva token no localStorage
6. Nas próximas requisições: header Authorization: Bearer <token>
7. Middleware auth.js valida o token e extrai req.userId
8. Ao recarregar a página: init() faz GET /auth/me com o token salvo
   — se válido, restaura sessão; se expirado, limpa localStorage
```

### 7.2 Práticas de Segurança Implementadas

| Prática | Como foi feito |
|---|---|
| Hash de senhas | bcryptjs com 10 rounds — nunca armazenado em texto puro |
| JWT sem dados sensíveis | Token contém apenas `{ id: usuario.id }` |
| Autenticação stateless | Sem sessão no servidor; tudo via token |
| Autorização por recurso | Queries com `AND doador_id = req.userId` — usuário só altera o próprio |
| Nome de arquivo randômico | `crypto.randomBytes(16).toString('hex')` — impede enumeração de fotos |
| Validação de tipo de arquivo | Multer filtra por extensão antes de salvar |
| Limite de tamanho de upload | 8 MB por arquivo (Multer) + 20 MB body (Nginx) |
| SQL Injection | Prevenido com queries parametrizadas (`$1`, `$2`, ...) |
| CORS | Habilitado via pacote `cors` no Express |

---

## 8. Upload e Serving de Fotos

### 8.1 Fluxo Completo de Upload

```
Frontend (navegador)
  1. Usuário clica na área de upload → abre seletor de arquivo nativo do SO
  2. Arquivos selecionados ficam em memória (array fotosParaEnviar)
  3. Prévia imediata exibida via URL.createObjectURL()
  4. Usuário clica em "Publicar":
     a. POST /api/itens → cria o item → recebe { id: 42 }
     b. Para cada arquivo: POST /api/itens/42/imagens (FormData)

Backend (dec-backend)
  5. Multer intercepta a requisição multipart
  6. Salva o arquivo em /app/uploads/<hash-aleatório>.<ext>
  7. Registra no banco: INSERT INTO imagens_item (item_id, url, ordem)
  8. Retorna { id, url: "/uploads/abc123.webp", ordem }

Serving (dec-nginx)
  9. GET /uploads/abc123.webp → servido diretamente do volume Docker
     sem passar pelo Node.js
     Cache-Control: public, max-age=2592000 (30 dias)
```

### 8.2 Volume Compartilhado

O volume Docker `doarecuidar_uploads` é montado em dois containers:
- **dec-backend** em `/app/uploads` → Multer grava os arquivos aqui
- **dec-nginx** em `/uploads` (somente leitura) → Nginx serve os arquivos daqui

Isso garante que as fotos persistam mesmo que os containers sejam reiniciados ou recriados.

---

## 9. Frontend — Telas e Funcionalidades

O frontend é uma **SPA (Single Page Application)** implementada em um único arquivo `index.html`. A navegação entre telas é feita por JavaScript, mostrando e ocultando seções sem recarregar a página.

### 9.1 Telas Implementadas

| Tela | Acesso | Funcionalidade |
|---|---|---|
| **Landing** | Público | Página inicial: hero com estatísticas reais, "como funciona", prévia das últimas 4 doações do banco, CTA de cadastro |
| **Feed / Explorar** | Público | Lista todos os itens `disponivel` com busca por texto, filtros de categoria, estado de conservação, cidade e ordenação |
| **Detalhe do item** | Público | Foto principal + galeria de miniaturas clicáveis, informações completas, botão de candidatura para receptores, opções de editar/encerrar para o próprio doador |
| **Auth** | Público | Formulários de login e cadastro em abas; validações no frontend; conectado ao backend real |
| **Publicar** | Logado | Wizard de 3 passos: (1) dados do item, (2) upload de até 5 fotos reais com prévia, (3) revisão e publicação |
| **Meus Itens (Painel)** | Logado | Lista as doações publicadas pelo usuário com status, candidaturas, opção de encerrar e editar cada item |
| **Perfil** | Logado | 3 abas: "Minhas doações" (histórico completo), "Candidaturas" (itens em que demonstrou interesse) e "Configurações" (editar nome, cidade, CEP) |
| **Dashboard** | Logado | KPIs e tabelas de atividade da plataforma |

### 9.2 Design System

Toda a identidade visual é definida por **CSS Custom Properties** (variáveis):

| Variável | Valor | Uso |
|---|---|---|
| `--verde` | `#1B7A4A` | Cor primária — botões, destaques |
| `--verde2` | `#25A065` | Verde hover |
| `--verde3` | `#E8F5EE` | Verde claro — fundos, badges |
| `--terra` | `#C85A1A` | Alertas, encerrar, erros |
| `--creme` | `#FAF8F4` | Fundo geral da página |
| `--preto` | `#1A1A16` | Textos principais |
| `--fonte` | `'Sora'` | Títulos e headings |
| `--fonte2` | `'DM Sans'` | Corpo de texto e labels |

Layout responsivo com breakpoints em `768px` e `480px` para mobile.

### 9.3 Estado Global da Aplicação

```javascript
let token         = localStorage.getItem('dec_token') || null; // JWT
let usuario       = null;        // objeto do usuário autenticado
let categoriasMap = {};          // id → { id, nome, emoji, slug }
let itemAtual     = null;        // item sendo visualizado no detalhe
let telaAnterior  = 'feed';      // para navegação de "voltar"
let pubStepAtual  = 1;           // step atual do wizard de publicação
let fotosParaEnviar = [];        // File[] selecionados para upload
let feedTimeout   = null;        // debounce da busca no feed
```

### 9.4 Comunicação com a API

Toda requisição JSON passa pela função centralizada:

```javascript
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res  = await fetch('/api' + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ' + res.status);
  return data;
}
```

Upload de fotos usa `fetch` + `FormData` diretamente (sem definir `Content-Type` manualmente, pois o navegador insere o `boundary` do multipart automaticamente).

### 9.5 Navbar com Dropdown de Usuário

Quando logado, o avatar (iniciais do nome) no canto superior direito abre um dropdown com:
- **👤 Meu perfil** → navega para a tela de perfil
- **🚪 Sair da conta** → limpa token do localStorage e retorna à landing

Clicar fora do menu o fecha automaticamente (listener no `document`).

### 9.6 Proteção de Rotas

A função `ir(tela)` bloqueia o acesso às telas protegidas:

```javascript
function ir(tela) {
  if (['painel','publicar','perfil','dashboard'].includes(tela) && !usuario) {
    mostrarAuth('login'); return;
  }
  // ... renderiza a tela
}
```

---

## 10. Configuração de Ambiente

### 10.1 Variáveis de Ambiente (`.env`)

| Variável | Exemplo | Descrição |
|---|---|---|
| `DB_HOST` | `camilassilvapsi-db-1` | Hostname do container PostgreSQL |
| `DB_PORT` | `5432` | Porta padrão do PostgreSQL |
| `DB_NAME` | `dec` | Nome do banco de dados |
| `DB_USER` | `postgres` | Usuário do banco |
| `DB_PASSWORD` | `***` | Senha do banco |
| `JWT_SECRET` | `string longa e aleatória` | Chave de assinatura dos tokens JWT |
| `PORT` | `3000` | Porta interna do servidor Node.js |

### 10.2 Nginx — nginx.conf

```nginx
server {
    listen 80;
    server_name doarecuidar.com.br www.doarecuidar.com.br;
    client_max_body_size 20m;

    # Fotos: servidas direto do volume, sem passar pelo Node.js
    location /uploads/ {
        alias /uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API — proxy para Node.js
    location /api/ {
        client_max_body_size 20m;
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 60s;
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
```

### 10.3 Docker Compose

```yaml
services:
  backend:
    build: ./backend            # Dockerfile com Node.js 20 Alpine
    container_name: dec-backend
    restart: unless-stopped
    env_file: .env
    volumes:
      - uploads:/app/uploads    # fotos persistidas
    networks: [dec-net, dec-db-shared]
    healthcheck:
      test: wget -qO- http://localhost:3000/api/health

  nginx:
    image: nginx:1.27-alpine
    container_name: dec-nginx
    restart: unless-stopped
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./frontend:/usr/share/nginx/html:ro
      - uploads:/uploads:ro     # serve as fotos
    depends_on:
      backend:
        condition: service_healthy
    networks: [dec-net, dec-web-shared]

volumes:
  uploads:    # volume nomeado — persiste reinicializações e rebuilds
```

### 10.4 Dockerfile do Backend

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev     # sem devDependencies em produção
COPY src/ ./src/
EXPOSE 3000
CMD ["node", "src/app.js"]
```

---

## 11. Processo de Deploy

O projeto usa um fluxo simples baseado em Git:

```
Desenvolvedor (local)          Servidor (38.199.208.34)
      │                                │
      │  git commit + push             │
      │──────────────────────────────►│
      │                               │
      │              cd /opt/doarecuidar && git pull
      │
      │  Mudança no frontend?  → Apenas git pull (nginx serve via volume montado)
      │  Mudança no backend?   → git pull + docker compose up -d --build --no-deps backend
      │  Mudança no nginx.conf → git pull + docker compose up -d --no-deps nginx
```

---

## 12. Fluxo Completo de uma Doação

```
Doador                          Sistema                         Receptor
  │                               │                               │
  │ 1. Cadastra conta             │                               │
  │    POST /auth/register        │                               │
  │──────────────────────────────►│                               │
  │◄──────────────────────────────│                               │
  │    { user, token }            │                               │
  │                               │                               │
  │ 2. Publica item + fotos       │                               │
  │    POST /itens                │                               │
  │    POST /itens/1/imagens (x5) │                               │
  │──────────────────────────────►│                               │
  │                               │  status: 'disponivel'         │
  │                               │  fotos salvas em /uploads/    │
  │                               │                               │
  │                               │◄──────────────────────────────│
  │                               │  3. Receptor se candidata     │
  │                               │     POST /candidaturas        │
  │                               │     { item_id, justificativa }│
  │                               │                               │
  │◄──────────────────────────────│                               │
  │ 4. Recebe notificação interna │                               │
  │    "Nova candidatura para..." │                               │
  │                               │                               │
  │ 5. Visualiza candidaturas     │                               │
  │    GET /candidaturas/item/1   │                               │
  │──────────────────────────────►│                               │
  │◄──────────────────────────────│                               │
  │    [ { usuario, justif... } ] │                               │
  │                               │                               │
  │ 6. Seleciona beneficiário     │                               │
  │    PATCH /candidaturas/3/     │                               │
  │         selecionar            │                               │
  │──────────────────────────────►│                               │
  │                               │  item → 'concluido'           │
  │                               │  outros → 'rejeitado'         │
  │                               │──────────────────────────────►│
  │                               │  7. Notificação:              │
  │                               │     "Você foi selecionado!"   │
```

---

## 13. Limitações Atuais e Evoluções Possíveis

| Funcionalidade | Status | Observação |
|---|---|---|
| Verificação de e-mail | Pendente | Campo `email_verificado` já existe no banco |
| Chat interno doador ↔ receptor | Pendente | Necessário para combinar a entrega |
| Notificação em tempo real | Pendente | Atualmente as notificações são consultadas sob demanda |
| Busca geográfica por raio (km) | Pendente | Filtro atual é por nome de cidade |
| Moderação de conteúdo | Pendente | Qualquer item pode ser publicado sem aprovação |
| Avaliação pós-doação | Pendente | Melhoraria reputação e confiança |
| App mobile nativo | Pendente | A API REST já está pronta para consumo por apps |
| Dashboard com dados reais | Parcial | Estrutura HTML/CSS existe; falta endpoint de estatísticas administrativas |
| Hero stats com dados reais | Parcial | IDs existem no HTML; falta endpoint público de contagens |

---

*Documentação produzida em 13 de junho de 2026 — reflete o estado atual do sistema em produção.*
