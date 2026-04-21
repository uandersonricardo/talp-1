# Experimento 2 — Sistema de Gerenciamento de Alunos e Avaliações

## Visão Geral

O objetivo deste experimento é usar um agente de IA (como o Claude Code) para desenvolver um sistema web de gerenciamento de alunos e avaliações, refletindo sobre as vantagens e desvantagens do uso de agentes para realizar esse tipo de atividade.

O sistema permite o gerenciamento de alunos, turmas, metas e avaliações com conceitos pedagógicos (MANA, MPA, MA), além de envio automático de emails com resumo diário das avaliações alteradas.

## Funcionalidades

1. **Gerenciamento de Alunos** — inclusão, alteração e remoção de alunos (nome, CPF, email), com página dedicada à listagem.
2. **Avaliações por Meta** — tabela com alunos nas linhas e metas nas colunas (ex.: Requisitos, Testes), com conceitos:
   - **MANA** — Meta Ainda Não Atingida
   - **MPA** — Meta Parcialmente Atingida
   - **MA** — Meta Atingida
3. **Persistência via JSON** — dados de alunos e avaliações salvos em arquivos JSON no servidor.
4. **Gerenciamento de Turmas** — inclusão, alteração e remoção de turmas, com tópico, ano, semestre, alunos matriculados e suas avaliações, visualizáveis individualmente.
5. **Notificação por Email** — ao preencher ou alterar uma avaliação, o aluno recebe um único email diário com o resumo de todas as avaliações modificadas em todas as suas turmas.

## Estrutura do Repositório

```
experiment-2/
├── backend/    # Servidor Node.js/Express com TypeScript
├── frontend/   # SPA React com TypeScript e Tailwind CSS v4
├── e2e/        # Testes de aceitação com Cucumber e Playwright
└── docs/       # Documentação: requisitos, arquitetura e guia de design
```

### `backend/`

API REST em Node.js com Express 5 e TypeScript. Responsável pela persistência dos dados em JSON, regras de negócio e envio de emails via cron job diário.

### `frontend/`

Aplicação React com TypeScript, Vite e Tailwind CSS v4. Interface para gerenciamento de alunos, turmas, metas e avaliações.

### `e2e/`

Testes de aceitação escritos em Gherkin (Cucumber) e executados com Playwright. Cobrem os principais fluxos do sistema.

### `docs/`

Documentação técnica do projeto:
- `requirements.md` — requisitos funcionais e não funcionais
- `architecture.md` — convenções, modelos de dados, endpoints e estrutura de UI
- `design-guidelines.md` — sistema de cores, tipografia e componentes

## Como Executar

### Backend

```bash
cd backend
npm install
npm run dev      # Inicia com nodemon (hot reload)
npm run build    # Compila TypeScript para dist/
npm start        # Executa a versão compilada
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # Servidor de desenvolvimento Vite
npm run build    # Verifica tipos + build de produção
npm run preview  # Pré-visualiza o build de produção
```

### Testes de Aceitação (E2E)

```bash
cd e2e
npm install
npm run test:e2e           # Executa os testes em modo headless
npm run test:e2e:headed    # Executa os testes com browser visível
```

## Deploy

| Serviço   | URL                              |
|-----------|----------------------------------|
| Frontend  | https://talp-1.vercel.app/       |
| Backend   | https://talp-1.onrender.com/     |

## Tecnologias

- **Backend**: Node.js, Express 5, TypeScript, nodemailer, node-cron
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query
- **Testes**: Cucumber, Playwright, Gherkin
- **Linting/Formatação**: Biome
