# Requirements

## Overview

Web system for managing students, classes, and evaluations. Instructors can register students and classes, record evaluations per learning goal, and students are automatically notified by email when their evaluations are updated. All UI text must be in Brazilian Portuguese.

---

## Functional Requirements

### FR-1: Student Management

- Create, edit, and delete students.
- Each student has: name, CPF (Brazilian national ID), and email.
- A dedicated page lists all registered students.

### FR-2: Class Management

- Create, edit, and delete classes.
- Each class has: topic description (e.g., "Introdução à Programação"), year, semester, enrolled students, and per-student evaluation data.
- A dedicated page lists all classes.
- Each class has a detail view showing its students and their evaluations.
- Students can be added to or removed from a class.

### FR-3: Evaluation Management

- A dedicated page displays evaluations as a table: rows are students, columns are learning goals (e.g., Requisitos, Testes).
- Grades are: **MANA** (Meta Ainda Não Atingida), **MPA** (Meta Parcialmente Atingida), **MA** (Meta Atingida).
- Instructors can fill in or update the grade for any student/goal combination.
- Evaluations are scoped to a class (each class has its own evaluation table).

### FR-4: Data Persistence

- All students, classes, and evaluations are persisted as JSON files on the server.
- Data survives server restarts.

### FR-5: Email Notifications

- When an instructor fills in or updates a student's grade for any goal, the system schedules an email to that student.
- At most one email per student per day is sent, regardless of how many evaluations were updated.
- The daily email consolidates all evaluation updates across all classes in which the student is enrolled, delivering them in a single message.

---

## Non-functional Requirements

- **Usability**: Clean, modern UI with clear navigation. Interactions must feel intuitive without training.
- **Performance**: Page loads and API responses should be fast under normal single-instructor usage.
- **Maintainability**: Code must be simple, well-structured, and low in complexity. Avoid over-engineering.
- **Language**: All labels, messages, buttons, and UI copy must be in Brazilian Portuguese.

---

## Technical Constraints

- Backend: Node.js/Express (TypeScript), existing monorepo structure under `backend/`.
- Frontend: React + Vite + Tailwind CSS v4 (TypeScript), existing monorepo structure under `frontend/`.
- Persistence: JSON files only — no database.
- No authentication or authorization required.
- Linting and formatting via Biome (not ESLint/Prettier).
