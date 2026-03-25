# Experimento 1 — Sistema de Criação e Correção de Provas

## Visão Geral

O objetivo deste experimento é usar um agente (como o GitHub Copilot em modo Agent no VSCode, ou o Claude Code) para desenvolver um sistema web simples de criação e correção de provas, refletindo sobre as vantagens e desvantagens do uso de um agente para realizar essa atividade.

## Funcionalidades

1. **Gerenciamento de questões** — inclusão, alteração e remoção de questões fechadas. Cada questão possui um enunciado e um conjunto de alternativas; cada alternativa tem sua descrição e a indicação de se deve ser marcada ou não pelo aluno.

2. **Gerenciamento de provas** — inclusão, alteração e remoção de provas. Cada prova é composta por questões previamente cadastradas. Ao criar uma prova, o usuário escolhe se as alternativas serão identificadas por **letras** ou por **potências de 2** (1, 2, 4, 8, 16, 32, ...).
   - *Letras*: espaço após a questão para o aluno indicar as letras marcadas.
   - *Potências de 2*: espaço para o aluno indicar a soma das alternativas marcadas.

3. **Geração de PDFs** — geração de um número configurável de provas individuais, com ordem de questões e alternativas embaralhadas. Cada PDF inclui:
   - Cabeçalho com nome da disciplina, professor, data, etc.
   - Rodapé de cada página com o número da prova individual.
   - Espaço ao final para nome e CPF do aluno.
   - CSV de gabarito gerado junto, contendo o número de cada prova e as respostas esperadas.

4. **Correção de provas** — importação de um CSV com o gabarito e um CSV com as respostas dos alunos (e.g., coletado via Google Forms). A correção pode ser:
   - *Rigorosa*: qualquer alternativa marcada incorretamente (selecionada ou não selecionada indevidamente) zera a questão inteira.
   - *Flexível*: a nota da questão é proporcional ao percentual de alternativas respondidas corretamente.
   - Ao final, o sistema gera um relatório de notas da turma.

## Stack

- **Frontend**: React + TypeScript (Vite, Tailwind CSS v4)
- **Backend**: Node.js + Express + TypeScript
- **Testes de aceitação**: Cucumber (Gherkin) + Playwright

## Estrutura do Repositório

```
experiment-1/
├── backend/    # Servidor Node.js/Express (API REST)
├── frontend/   # Cliente React (SPA)
├── e2e/        # Testes de aceitação com Cucumber + Playwright
└── docs/       # Documentação (requisitos, API, diretrizes de design)
```

### `backend/`

API REST construída com Express 5 e TypeScript. Contém as rotas para questões, provas, geração de PDFs/CSV e correção.

```bash
cd backend
npm install
npm run dev      # Inicia com nodemon (hot-reload)
npm run build    # Compila TypeScript para dist/
npm start        # Executa a versão compilada
npm test         # Executa os testes unitários com Vitest
```

### `frontend/`

SPA React com TypeScript, Vite e Tailwind CSS v4.

```bash
cd frontend
npm install
npm run dev      # Inicia o servidor de desenvolvimento Vite
npm run build    # Type-check + build de produção
npm run preview  # Pré-visualiza o build de produção
```

### `e2e/`

Testes de aceitação escritos em Gherkin (Cucumber) e executados com Playwright.

```bash
cd e2e
npm install
npx playwright install   # Instala os browsers necessários
npm run test:e2e         # Executa os testes em modo headless
npm run test:e2e:headed  # Executa com browser visível
```

### `docs/`

Documentação do projeto:

- `requirements.md` — especificação completa dos requisitos funcionais
- `api.md` — contrato da API REST e rotas do frontend
- `design-guidelines.md` — sistema visual e diretrizes de UX

## Deploy

| Serviço   | URL |
|-----------|-----|
| Frontend  | <https://talp-1.vercel.app/> |
| Backend   | <https://talp-1.onrender.com/> |

## Linting e Formatação

Ambos os projetos usam **Biome** (não ESLint/Prettier). Execute a partir do subdiretório respectivo:

```bash
npx biome check .           # Verifica lint e formatação
npx biome check --write .   # Corrige automaticamente
```
