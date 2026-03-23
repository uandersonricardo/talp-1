# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a monorepo with two separate projects:

- `backend/` — Node.js/Express API server (TypeScript, CommonJS)
- `frontend/` — React SPA (TypeScript, Vite, Tailwind CSS v4)

Each project has its own `package.json`, `node_modules`, and `biome.json`. Commands must be run from within the respective subdirectory.

The application is an exam management system. See [`docs/requirements.md`](docs/requirements.md) for the full feature spec, [`docs/api.md`](docs/api.md) for the API contract and UI routes, and [`docs/design-guidelines.md`](docs/design-guidelines.md) for the visual and UX system.

---

### Backend folder structure

```
backend/
  src/
    index.ts          # Express app setup: middleware, route mounting, server start
    db.ts             # In-memory data store (Questions, Exams, GenerationBatches)
    types.ts          # TypeScript interfaces matching the API models (see docs/api.md § Data Models)
    routes/
      questions.ts    # GET/POST /api/questions, GET/PUT/DELETE /api/questions/:id
      exams.ts        # GET/POST /api/exams, GET/PUT/DELETE /api/exams/:id
      generation.ts   # POST /api/exams/:id/generate, GET /api/exams/:id/batches,
                      # GET /api/batches/:batchId/pdf, GET /api/batches/:batchId/answers.csv
      grading.ts      # POST /api/grade
    services/
      questionService.ts   # CRUD logic for questions; enforces "not deletable if used in exam" rule
      examService.ts       # CRUD logic for exams; enforces "not deletable if batches exist" rule
      generationService.ts # Shuffling logic, PDF assembly, CSV answer-key generation
      gradingService.ts    # Strict/lenient grading, class report CSV generation
  dist/               # Compiled output (git-ignored)
```

**Conventions:**
- Each router file in `routes/` creates an `express.Router()` and exports it; `index.ts` mounts them under `/api`.
- Business logic lives entirely in `services/`; route handlers only parse inputs, call a service, and send the response.
- `db.ts` exports plain in-memory arrays/maps. Services import from `db.ts` directly — no repository layer needed at this scale.
- All shared TypeScript types (matching the models in `docs/api.md`) are defined once in `types.ts` and imported wherever needed.

---

### Frontend folder structure

```
frontend/
  src/
    main.tsx          # React root: renders <App /> into #root
    App.tsx           # Router setup; maps URL routes (see docs/api.md § UI Structure) to page components
    types.ts          # TypeScript interfaces mirroring backend models (kept in sync with backend/src/types.ts)
    styles/
      main.css        # @import "tailwindcss" + CSS custom properties from docs/design-guidelines.md
    pages/            # One file per route; thin — compose components, call hooks, handle page-level state
      QuestionsPage.tsx      # /questions
      QuestionFormPage.tsx   # /questions/new and /questions/:id/edit (mode determined by route params)
      ExamsPage.tsx          # /exams
      ExamFormPage.tsx       # /exams/new and /exams/:id/edit
      ExamDetailPage.tsx     # /exams/:id
      GradingPage.tsx        # /grade
    components/       # Reusable components; flat — no subdirectories
      # Layout
      Layout.tsx             # App shell: sidebar rail (desktop) / top bar + drawer (mobile)
      # Domain components (used by pages)
      QuestionList.tsx
      QuestionForm.tsx
      ExamList.tsx
      ExamForm.tsx
      ExamDetail.tsx
      GenerationPanel.tsx    # "Generate exams" section + batch history table inside ExamDetailPage
      GradingForm.tsx
      # Shared UI primitives (implement the system defined in docs/design-guidelines.md)
      Button.tsx
      Input.tsx
      Textarea.tsx
      Select.tsx
      Card.tsx
      Dialog.tsx
      Toast.tsx
      Spinner.tsx
      EmptyState.tsx
      Pagination.tsx
    api/              # One module per backend resource; all fetch calls live here
      client.ts              # Base fetch wrapper (sets base URL, handles error shape from docs/api.md)
      questions.ts
      exams.ts
      generation.ts
      grading.ts
    hooks/            # Custom hooks for data fetching and shared stateful logic
      useQuestions.ts
      useExams.ts
      useToast.ts
```

**Conventions:**
- Pages are responsible for routing concerns (reading params, navigating); components are unaware of the router.
- All API calls go through `api/client.ts`; no `fetch` calls in components or hooks directly.
- Shared UI primitives in `components/` accept only generic props (no business logic, no API calls).
- CSS custom properties (colors, spacing, typography tokens) are defined in `styles/main.css`; Tailwind utility classes reference them via `var(--token)` as needed.
- `types.ts` in `frontend/` mirrors `backend/src/types.ts`; they must be kept in sync manually.

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
