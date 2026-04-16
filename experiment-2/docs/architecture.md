# System Architecture

## Conventions

### Backend conventions
- Routes are thin: parse input, call a service, return JSON. No business logic inside route files.
- Services are pure functions that read/write state and return results; they never touch `req`/`res`.
- All JSON files are read/written through `services/storage.ts`, which is the single I/O layer.
- Startup sequence in `index.ts`: load data, register routes, start HTTP server, start email job.

### Frontend conventions
- Functional components with hooks only; no class components.
- All HTTP calls go through `api/index.ts`; no `fetch` calls inside components.
- Pages handle state and data fetching; components are stateless or self-contained UI units.
- React Router handles all navigation; no direct `window.location` manipulation.

---

## Data Models

All types are defined in `types.ts` for each project and kept in sync manually.

```ts
type Grade = "MANA" | "MPA" | "MA";

interface Student {
  id: string;          // UUID
  name: string;
  cpf: string;
  email: string;
}

interface Goal {
  id: string;          // UUID
  name: string;        // e.g. "Requisitos", "Testes"
}

interface Class {
  id: string;          // UUID
  description: string; // e.g. "Introdução à Programação"
  year: number;
  semester: 1 | 2;
  studentIds: string[];
}

interface Evaluation {
  id: string;          // UUID
  classId: string;
  studentId: string;
  goalId: string;
  grade: Grade;
  updatedAt: string;   // ISO 8601 datetime
}

interface EmailQueueEntry {
  studentId: string;
  date: string;        // YYYY-MM-DD
  updates: Array<{ classId: string; goalId: string; grade: Grade }>;
  sent: boolean;
}
```

### Persistence files (`backend/data/`)
| File | Contents |
|------|----------|
| `students.json` | `Student[]` |
| `goals.json` | `Goal[]` |
| `classes.json` | `Class[]` |
| `evaluations.json` | `Evaluation[]` |
| `email-queue.json` | `EmailQueueEntry[]` |

All files are initialized to `[]` if they do not exist.

---

## API Endpoints

Base path: `/api`

### Students
| Method | Path | Description |
|--------|------|-------------|
| GET | `/students` | List all students |
| POST | `/students` | Create a student |
| PUT | `/students/:id` | Update a student |
| DELETE | `/students/:id` | Delete a student |

### Goals
| Method | Path | Description |
|--------|------|-------------|
| GET | `/goals` | List all goals |
| POST | `/goals` | Create a goal |
| DELETE | `/goals/:id` | Delete a goal |

### Classes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/classes` | List all classes |
| POST | `/classes` | Create a class |
| PUT | `/classes/:id` | Update a class |
| DELETE | `/classes/:id` | Delete a class |
| POST | `/classes/:id/students/:studentId` | Enroll a student |
| DELETE | `/classes/:id/students/:studentId` | Unenroll a student |

### Evaluations
| Method | Path | Description |
|--------|------|-------------|
| GET | `/classes/:classId/evaluations` | Get all evaluations for a class |
| PUT | `/classes/:classId/evaluations` | Upsert a grade `{ studentId, goalId, grade }` — triggers email queue |

All endpoints return `{ data }` on success and `{ error: string }` on failure with an appropriate HTTP status code.

---

## UI Structure

Routing via React Router (`react-router-dom`). All page titles and UI copy in Brazilian Portuguese.

```
/                     → redirect to /alunos
/alunos               → StudentsPage
/turmas               → ClassesPage
/turmas/:id           → ClassDetailPage
/metas                → GoalsPage
```

### Pages
- **StudentsPage** — table of students; inline modal for create/edit; confirmation for delete.
- **ClassesPage** — table of classes (description, year, semester, student count); inline modal for create/edit; confirmation for delete.
- **ClassDetailPage** — class header info; list of enrolled students with add/remove controls; evaluation table (rows = students, columns = goals, cells = grade selector).
- **GoalsPage** — list of learning goals; add/remove controls.

### Shared components
- `Modal` — generic dialog wrapper.
- `ConfirmDialog` — confirmation prompt for destructive actions.
- `EvaluationTable` — renders the student × goal grid; each cell is a `GradeSelector`.
- `GradeSelector` — button group for MANA / MPA / MA / blank; highlights current grade.

### Navigation
A persistent sidebar or top nav links to Alunos, Turmas, and Metas. Active route is highlighted.

---

## Code Quality

- **TypeScript strict mode** is enabled in both projects. Avoid `any`; use `unknown` + narrowing where needed.
- **Biome** enforces formatting and linting. Run `npx biome check --write .` before committing.
- **No duplication**: shared logic lives in a service or utility, not copy-pasted across routes.
- **No premature abstractions**: do not generalize until there are at least three concrete cases.
- **Error handling**: routes return structured error responses; services throw typed errors; the frontend shows inline user-facing messages in Portuguese.
- **No business logic in routes or components**: routes delegate to services; components delegate to `api/index.ts`.

---

## Email Notifications

### Queue strategy
When `PUT /api/classes/:classId/evaluations` is called:
1. Save the evaluation.
2. Call `services/emailQueue.ts → enqueue(studentId, classId, goalId, grade)`.
3. `enqueue` reads `email-queue.json`, finds the entry for `(studentId, today)`:
   - If not found: create a new entry with `sent: false` and the update.
   - If found and `sent: false`: append the update to `entry.updates`.
   - If found and `sent: true`: create a new entry for today (edge case: grade updated after digest was sent).
4. Write the updated queue back to disk.

### Daily digest Job
A cron job runs once per day at **07:00 (America/Sao_Paulo)** and:
1. Reads all entries in `email-queue.json` where `date < today`.
2. For each entry, sends one email to the student (looked up by `studentId`).
3. On successful send, removes the entry from the queue.
4. Persists the updated queue.

### Email content
- **Subject**: `Avaliações atualizadas — [date formatted as DD/MM/YYYY]`
- **Body** (plain text or HTML): greets the student by name, lists each update grouped by class: class description, goal name, and new grade with its full Portuguese label.

### SMTP configuration
Read from environment variables (`.env`):
```
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```
Use `nodemailer`. If env vars are absent, log a warning on startup and skip email sending (queue still accumulates).
