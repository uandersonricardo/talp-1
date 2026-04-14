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
