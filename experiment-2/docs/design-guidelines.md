# Design Guidelines

## Design Philosophy

Clean, purposeful, and understated. Every visual element should earn its place by reducing friction or communicating meaning — not by decorating. Inspiration is drawn from Google's newer product design language (NotebookLM, Google Classroom): generous whitespace, restrained color, clear hierarchy, and a confident use of typography.

**Core principles:**
- **Clarity first** — the user's eye should land on the primary action with zero ambiguity.
- **Low noise** — borders, shadows, and color are used sparingly. When everything competes, nothing wins.
- **Density with breathing room** — data-dense tables are unavoidable in this app; they must still feel open, not cramped.
- **Consistent rhythm** — spacing, rounding, and type scale follow strict rules so the interface feels coherent across all pages.

---

## Color System

All colors are defined as CSS custom properties on `:root` and consumed by Tailwind via `@theme` in `main.css`.

### Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#F8F9FF` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, modals, tables |
| `--color-surface-variant` | `#F0F4FF` | Sidebar, table header, input backgrounds |
| `--color-border` | `#E2E6F0` | All borders |
| `--color-border-strong` | `#C5CBDC` | Focused inputs, active rows |
| `--color-primary` | `#1A6EF5` | Primary buttons, active nav, links |
| `--color-primary-hover` | `#1558D0` | Primary button hover |
| `--color-primary-subtle` | `#EBF1FE` | Selected row tint, chip backgrounds |
| `--color-text-primary` | `#1C1E2B` | Headings, body copy |
| `--color-text-secondary` | `#5C6278` | Labels, metadata, placeholders |
| `--color-text-disabled` | `#A9AFBF` | Disabled controls |
| `--color-destructive` | `#D93025` | Delete actions, error states |
| `--color-destructive-subtle` | `#FDECEA` | Destructive button hover background |

### Grade colors

Grades carry semantic meaning and must be immediately distinguishable.

| Grade | Pill background | Pill text |
|-------|-----------------|-----------|
| **MA** — Meta Atingida | `#E6F4EA` | `#1E7E34` |
| **MPA** — Meta Parcialmente Atingida | `#FEF7E0` | `#B45309` |
| **MANA** — Meta Ainda Não Atingida | `#FDECEA` | `#B71C1C` |
| *(empty)* | `#F0F4FF` | `#5C6278` |

---

## Typography

Font family: **Inter** (loaded from Google Fonts). Fallback: `system-ui, sans-serif`.

```css
/* main.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
```

| Role | Size | Weight | Line height | Usage |
|------|------|--------|-------------|-------|
| Page title | 20px / 1.25rem | 600 | 1.3 | `<h1>` on each page |
| Section title | 16px / 1rem | 600 | 1.4 | Card headers, modal titles |
| Body | 14px / 0.875rem | 400 | 1.5 | Table cells, form fields, paragraphs |
| Label / caption | 12px / 0.75rem | 500 | 1.4 | Column headers, metadata, chips |
| Button | 14px / 0.875rem | 500 | 1 | All button labels |

Letter spacing is default (0) for body copy; column headers use `tracking-wide` (0.05em) and uppercase for visual separation.

---

## Spacing

Base unit: **4px**. All spacing uses multiples of 4.

| Token (Tailwind) | Value | Common use |
|-----------------|-------|------------|
| `p-1` | 4px | Tight internal padding (chips, badges) |
| `p-2` | 8px | Icon buttons, small inputs |
| `p-3` | 12px | Table cells (vertical), form field padding |
| `p-4` | 16px | Card padding, modal sections |
| `p-6` | 24px | Page content padding, modal header/footer |
| `p-8` | 32px | Page outer padding (desktop) |
| `gap-4` | 16px | Default gap between stacked elements |
| `gap-6` | 24px | Gap between page sections |

Table cell padding: `px-4 py-3`. Do not reduce below `py-2` — rows must have visual breathing room.

---

## Elevation & Borders

Avoid heavy drop shadows. Use border + background differentiation to create hierarchy.

| Level | Treatment | Used for |
|-------|-----------|----------|
| 0 — Flat | No shadow, no border | Page background, sidebar |
| 1 — Raised | `border border-[--color-border]` | Cards, tables, inputs |
| 2 — Floating | `shadow-md` (`0 4px 16px rgba(0,0,0,0.08)`) | Dropdowns, tooltips, popovers |
| 3 — Overlay | `shadow-xl` + backdrop | Modals |

**Border radius:**
- Default UI elements (inputs, buttons, chips): `rounded-lg` (8px)
- Cards and panels: `rounded-xl` (12px)
- Modals: `rounded-2xl` (16px)
- Pills/badges: `rounded-full`

---

## Layout & Navigation

### Shell

The app uses a **fixed left sidebar** (240px wide) on desktop and a **bottom navigation bar** on mobile. The main content area fills the remaining width with a max content width of 1200px, centered.

```
┌────────────┬──────────────────────────────────────┐
│            │  Page title                [action]  │
│  Sidebar   │──────────────────────────────────────│
│            │                                      │
│  • Alunos  │  Content area                        │
│  • Turmas  │                                      │
│  • Metas   │                                      │
│            │                                      │
└────────────┴──────────────────────────────────────┘
```

### Sidebar
- Background: `--color-surface-variant`
- Width: 240px, fixed, full height
- Contains: app name/logo at top, nav links, no footer
- Nav items: icon + label, 40px height, `rounded-lg` hover state using `--color-primary-subtle`
- Active item: `--color-primary-subtle` background, `--color-primary` text and icon

### Page header
Each page has a sticky header row (inside the content area) with:
- Page title (left)
- Primary action button (right, e.g. "Novo Aluno", "Nova Turma")

---

## Components

### Primary button
- Background: `--color-primary`, text: white, `rounded-lg`, `px-4 py-2`
- Hover: `--color-primary-hover`
- Disabled: `--color-text-disabled` background, not clickable
- Use for one action per screen/modal

### Secondary button (ghost)
- Background: transparent, border: `--color-border`, text: `--color-text-primary`
- Hover: `--color-surface-variant` background
- Use for cancel, secondary actions

### Destructive button
- Background: transparent, text: `--color-destructive`
- Hover: `--color-destructive-subtle` background
- Use only inside confirmation dialogs, never as the primary CTA on a screen

### Input / Select
- Border: `--color-border`, background: white, `rounded-lg`, `px-3 py-2`
- Focus: border `--color-primary`, `ring-2 ring-[--color-primary]/20`
- Error: border `--color-destructive`, error message below in 12px red text
- Labels sit above the input, `font-medium text-xs text-[--color-text-secondary]`

### Table
- Full width, `rounded-xl` container with `border border-[--color-border]`, `overflow-hidden`
- Header row: `--color-surface-variant` background, `uppercase text-xs tracking-wide font-medium text-[--color-text-secondary]`
- Body rows: white background, `border-t border-[--color-border]`
- Row hover: `--color-surface-variant` background, `transition-colors duration-100`
- Actions column: right-aligned, contains icon buttons (edit, delete), visible on row hover or always

### Modal
- Backdrop: `rgba(0,0,0,0.35)`, centered overlay, fade in
- Panel: white, `rounded-2xl`, `shadow-xl`, max width 480px (forms) or 640px (wide content)
- Structure: header (`px-6 pt-6 pb-4`), scrollable body (`px-6`), footer with action buttons (`px-6 py-4 border-t`)
- Close button (×) in the top-right corner of the header

### Grade selector (GradeSelector)
- A segmented button group with three options: MA, MPA, MANA
- Each option is a pill button; the selected one uses the corresponding grade color (background + text)
- Unselected options: `--color-surface-variant` background, `--color-text-secondary` text
- Compact size: `px-3 py-1 text-xs font-medium rounded-full`
- Empty state shows a "—" placeholder that opens the selector on click

### Confirmation dialog
- A small modal (max width 400px) with a warning icon, descriptive message, and two buttons: "Cancelar" (secondary) and the destructive action (e.g. "Excluir")
- Never delete immediately on click — always confirm first

### Toast / notification
- Bottom-right corner, `rounded-xl`, `shadow-lg`, 320px max width
- Auto-dismiss after 4 seconds
- Variants: success (green left border), error (red left border), info (blue left border)

---

## Key Screen Patterns

### List page (Alunos, Turmas, Metas)
```
[Page title]                              [+ Nova Turma]

┌─────────────────────────────────────────────────────┐
│ Descrição          Ano   Semestre   Alunos          │
├─────────────────────────────────────────────────────┤
│ Intro à Prog.      2026  1º         12       ✏ 🗑  │
│ Estruturas de D.   2026  1º          8       ✏ 🗑  │
└─────────────────────────────────────────────────────┘
```
- Empty state: centered illustration + "Nenhum registro encontrado" + primary action button.

### Class detail page
```
← Turmas    Introdução à Programação — 2026, 1º Semestre

[Alunos matriculados]               [+ Matricular aluno]
┌───────────────────────────────┐
│ Nome          CPF       E-mail │
│ ...                      🗑  │
└───────────────────────────────┘

[Avaliações]
┌────────────┬───────────┬────────────┬──────────────┐
│ Aluno      │ Requisitos│ Testes     │ Arquitetura  │
├────────────┼───────────┼────────────┼──────────────┤
│ Ana Lima   │ [MA]      │ [MPA]      │ [—]          │
│ João Silva │ [MANA]    │ [—]        │ [MA]         │
└────────────┴───────────┴────────────┴──────────────┘
```
- The evaluation table has a sticky first column and is horizontally scrollable.
- Each grade cell is clickable and opens the `GradeSelector` inline.

### Create/edit modal
- Title: "Novo Aluno" / "Editar Aluno"
- Fields stacked vertically with 16px gap
- Footer: "Cancelar" (left) + "Salvar" (right, primary)
- On save: close modal, update list, show success toast

---

## Responsive Breakpoints

| Name | Min width | Layout change |
|------|-----------|---------------|
| `sm` | 640px | Single-column stacking for forms |
| `md` | 768px | Table columns gain more padding |
| `lg` | 1024px | Sidebar appears; bottom nav hidden |
| `xl` | 1280px | Content max-width kicks in (1200px) |

**Mobile (< 1024px):**
- Sidebar is replaced by a bottom navigation bar with icons + short labels.
- Page header action button shrinks to an icon-only `+` button (`rounded-full`, 44×44px).
- Tables scroll horizontally inside a `overflow-x-auto` wrapper; the first column (name) is sticky.
- Modals take 90vw and anchor to the bottom of the screen (`rounded-b-none`, slide-up animation).

---

## Iconography

Use **Lucide React** (`lucide-react`) as the sole icon library. It is tree-shaken, consistent in style, and matches the clean aesthetic.

- Default size: 16px inside buttons, 18px in navigation, 20px for standalone actions.
- Stroke width: 1.75px (Lucide default).
- Icons never appear alone in interactive controls — always paired with a label or a `title` / `aria-label`.

Common icons used in this app:

| Action | Icon |
|--------|------|
| Add | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Back | `ChevronLeft` |
| Close (modal) | `X` |
| Student | `User` |
| Class | `BookOpen` |
| Goal | `Target` |
| Email sent | `Mail` |

---

## Motion & Transitions

Keep motion subtle and fast. Its role is to confirm interactions and provide spatial context, not to entertain.

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Modal open | fade + scale from 96% → 100% | 150ms | `ease-out` |
| Modal close | fade + scale to 96% | 100ms | `ease-in` |
| Mobile modal | slide up from bottom | 200ms | `ease-out` |
| Row hover bg | background-color | 100ms | `linear` |
| Button hover | background-color | 100ms | `linear` |
| Toast enter | slide in from right + fade | 200ms | `ease-out` |
| Toast exit | fade out | 150ms | `ease-in` |
| Sidebar nav active | background-color | 100ms | `linear` |

Never animate layout properties (`width`, `height`, `top`) — use `opacity` and `transform` exclusively for performance.

---

## Accessibility

Even without auth, the interface must be usable with keyboard and screen readers.

- All interactive elements are reachable via `Tab` and activated via `Enter`/`Space`.
- Focus rings are always visible: `outline-2 outline-offset-2 outline-[--color-primary]`. Never suppress `outline` without a replacement.
- Color is never the sole indicator of meaning — grade pills include a text label (MA, MPA, MANA), not just color.
- All icon-only buttons have an `aria-label` in Portuguese.
- Modal dialogs trap focus while open and restore focus to the trigger element on close.
- Form inputs have associated `<label>` elements (not just placeholder text).
- Minimum tap target size: 44×44px for all interactive elements.
- Contrast ratios meet WCAG AA: body text (4.5:1), large text (3:1).
