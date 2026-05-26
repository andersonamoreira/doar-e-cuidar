# 🌱 Doar é Cuidar

Plataforma de doações online que conecta quem quer ajudar com quem precisa, de forma organizada, segura e transparente.

## Sobre o projeto

O **Doar é Cuidar** é um sistema de doações onde qualquer pessoa pode publicar itens que deseja doar e receber candidaturas de interessados. O doador lê as justificativas e escolhe quem receberá o item — um processo simples, humano e transparente.

Desenvolvido como **Projeto Integrador III** — FAESA, 2026.
**Equipe:** Anderson Moreira, Bruna Soares, Mayara Hafez.

## Como funciona

```
1. Cadastre seu item  →  2. Receba candidaturas  →  3. Escolha o beneficiário
```

1. **Cadastre seu item** — Publique o que deseja doar com fotos, descrição e categoria. Leva menos de 2 minutos.
2. **Receba candidaturas** — Interessados enviam uma justificativa explicando por que gostariam de receber o item.
3. **Escolha o beneficiário** — Você lê as justificativas e decide quem receberá a doação.

## Funcionalidades

- **Landing page** — Apresentação da plataforma com estatísticas e doações recentes
- **Cadastro e login** — Criação de conta como doador, receptor ou ambos
- **Feed de doações** — Listagem de itens disponíveis com busca, filtros por categoria, estado de conservação e cidade
- **Publicar doação** — Formulário em 3 etapas (dados do item → fotos → revisão)
- **Candidatura** — Receptor envia justificativa; doador seleciona o beneficiário
- **Painel do doador** — Gerenciamento dos itens publicados e candidaturas recebidas
- **Dashboard** — Visão geral da plataforma com KPIs e gráficos
- **Perfil** — Histórico de doações realizadas e candidaturas enviadas

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Interface | HTML5, CSS3, JavaScript (vanilla) |
| Fontes | Sora + DM Sans (Google Fonts) |
| Hospedagem | GitHub Pages (protótipo) |

> **Protótipo atual:** SPA em arquivo HTML único, com dados simulados em memória. A evolução para sistema completo incluirá backend, banco de dados e autenticação real.

## Como executar

Por ser um arquivo HTML único, basta abrir diretamente no navegador:

```bash
# Clone o repositório
git clone https://github.com/andersonamoreira/doar-e-cuidar.git

# Abra o arquivo no navegador
start doar-e-cuidar.html   # Windows
open doar-e-cuidar.html    # macOS
```

Ou acesse diretamente pelo GitHub Pages (quando disponível).

## Estrutura do projeto

```
doar-e-cuidar/
├── doar-e-cuidar.html   # Aplicação completa (HTML + CSS + JS)
└── README.md
```

## Próximos passos

- [ ] Backend com API REST (Node.js ou Python)
- [ ] Banco de dados para persistência (PostgreSQL ou MongoDB)
- [ ] Autenticação real com JWT
- [ ] Upload de imagens para armazenamento em nuvem
- [ ] Notificações por e-mail ao selecionar beneficiário
- [ ] Deploy em produção

## Licença

Projeto acadêmico — FAESA, 2026. Todos os direitos reservados.
