# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a monorepo with two separate projects:

- `backend/` — Node.js/Express API server (TypeScript, CommonJS)
- `frontend/` — React SPA (TypeScript, Vite, Tailwind CSS v4)

Each project has its own `package.json`, `node_modules`, and `biome.json`. Commands must be run from within the respective subdirectory.

## Development Commands

### Backend (`cd backend`)
```bash
npm run dev      # Start with nodemon (watches src/**/*.ts, runs via ts-node)
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled output from dist/index.js
```

### Frontend (`cd frontend`)
```bash
npm run dev      # Vite dev server
npm run build    # Type-check + Vite build
npm run preview  # Preview production build
```

## Linting & Formatting

Both projects use **Biome** (not ESLint/Prettier) for linting and formatting. Run from the respective subdirectory:

```bash
npx biome check .          # Lint + format check
npx biome check --write .  # Auto-fix
npx biome format --write . # Format only
```

Key Biome config (same for both):
- Indent: spaces, line width: 120
- Quotes: double
- Import organization: auto-sorted
- Several rules disabled: `noExplicitAny`, `noArrayIndexKey`, `noNonNullAssertion`, `useExhaustiveDependencies`, `a11y`

## Architecture

**Backend**: Entry point is `backend/src/index.ts`. Built with Express 5, CORS, dotenv. Compiles to `backend/dist/`. TypeScript targets ES6 with strict mode, decorator support enabled.

**Frontend**: Entry point is `frontend/src/main.tsx`, rendered into `#root`. Tailwind CSS v4 is imported via `frontend/src/styles/main.css` using `@import "tailwindcss"` (no config file needed). Vite handles bundling with `@vitejs/plugin-react`.

## Requirements

See [`docs/requirements.md`](docs/requirements.md) for the full functional and non-functional requirements, including student/class/evaluation management (FR-1–FR-4), email notifications (FR-5), and technical constraints.

## Folder Structure

See [`docs/architecture.md`](docs/architecture.md) for conventions, data models, API endpoints, and UI structure that informed this layout.

### Backend (`backend/`)

```
backend/
├── data/           # JSON persistence files (students, goals, classes, evaluations, email-queue)
└── src/
    ├── routes/     # Thin Express route handlers — one file per resource (students, goals, classes, evaluations)
    ├── services/   # Pure functions for business logic and I/O: storage, emailQueue, email sender, daily digest job
    ├── types.ts    # All shared TypeScript types (Student, Goal, Class, Evaluation, EmailQueueEntry)
    └── index.ts    # Entry point: loads data, registers routes, starts HTTP server, starts cron job
```

- `routes/` — parse input, call a service, return JSON; no business logic (see [architecture conventions](docs/architecture.md#backend-conventions))
- `services/` — `storage.ts` is the sole JSON I/O layer; `emailQueue.ts` manages the queue; `email.ts` handles SMTP via nodemailer; `dailyDigest.ts` is the 07:00 cron job
- `data/` lives outside `src/` so it is not compiled and persists across builds

### Frontend (`frontend/`)

```
frontend/
└── src/
    ├── api/        # All HTTP calls — single index.ts; no fetch calls inside components
    ├── components/ # Stateless/self-contained UI units: Modal, ConfirmDialog, EvaluationTable, GradeSelector, Toast, Sidebar
    ├── pages/      # Page components that own state and data fetching: StudentsPage, ClassesPage, ClassDetailPage, GoalsPage
    ├── styles/     # main.css — Tailwind v4 import, CSS custom properties (color tokens, typography)
    ├── types.ts    # Shared TypeScript types (kept in sync with backend manually)
    └── main.tsx    # Entry point: React root, Router, layout shell
```

- `api/` centralises all `fetch` calls (see [architecture conventions](docs/architecture.md#frontend-conventions))
- `components/` holds reusable UI pieces described in [`docs/design-guidelines.md`](docs/design-guidelines.md#components) and [`docs/architecture.md`](docs/architecture.md#shared-components)
- `pages/` maps 1-to-1 with the routes defined in [`docs/architecture.md`](docs/architecture.md#ui-structure)
- CSS custom properties in `styles/main.css` define the full color system from [`docs/design-guidelines.md`](docs/design-guidelines.md#color-system)
