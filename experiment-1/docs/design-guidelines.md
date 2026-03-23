# Design Guidelines

This document defines the visual language, interaction patterns, and UX principles for the exam management system. All frontend work must adhere to these guidelines to ensure a consistent, high-quality experience.

---

## 1. Design Philosophy

The interface draws inspiration from Google's newer product aesthetic — as seen in NotebookLM, Drive, and Keep — characterized by confident use of whitespace, a restrained color palette, and purposeful elevation. The goal is a tool that feels professional and calm, where structure guides the user's eye without visual noise competing for attention.

**Core principles:**

- **Clarity over decoration.** Every element must earn its place. Avoid ornamental borders, dividers, and shadows unless they communicate meaningful hierarchy.
- **Progressive disclosure.** Show what is needed for the current task. Secondary actions (edit, delete) appear on interaction (hover/focus), not by default.
- **Minimum viable navigation.** Any primary action — creating a question, generating a batch, uploading for grading — must be reachable in at most two clicks from any screen.
- **Responsive by default.** Layouts are designed mobile-first and adapt to wider viewports. No feature is hidden or degraded on small screens.

---

## 2. Color System

Light mode only. All values are CSS custom properties defined on `:root`.

### Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#1A73E8` | Primary actions, links, active states |
| `--color-primary-hover` | `#1558B0` | Button hover, active press |
| `--color-primary-surface` | `#E8F0FE` | Selected row tint, chip background, focus ring fill |
| `--color-surface` | `#FFFFFF` | Cards, modals, form panels |
| `--color-surface-dim` | `#F8F9FA` | Page background, sidebar, table alternating rows |
| `--color-surface-container` | `#F1F3F4` | Input backgrounds, inactive chip backgrounds |
| `--color-outline` | `#DADCE0` | Input borders, dividers, card borders |
| `--color-outline-focus` | `#1A73E8` | Focused input border |
| `--color-on-surface` | `#202124` | Body text, headings |
| `--color-on-surface-muted` | `#5F6368` | Secondary text, placeholder text, labels |
| `--color-on-primary` | `#FFFFFF` | Text and icons on primary buttons |
| `--color-success` | `#137333` | Success states, correct indicators |
| `--color-success-surface` | `#E6F4EA` | Success banners |
| `--color-warning` | `#B06000` | Warnings, lenient grading indicator |
| `--color-warning-surface` | `#FEF7E0` | Warning banners |
| `--color-error` | `#C5221F` | Validation errors, destructive actions |
| `--color-error-surface` | `#FCE8E6` | Inline error backgrounds |

### Usage rules

- Primary blue is reserved for the single most important action on each screen. Do not use it for secondary or tertiary actions.
- Surface tones (`--color-surface-dim`, `--color-surface-container`) distinguish regions without using borders.
- Never use more than one semantic color (success/warning/error) in the same visible region unless each refers to a distinct status.
- Do not use color alone to convey meaning — pair it with an icon or label.

---

## 3. Typography

Font family: **Inter** (import from Google Fonts). Fallback: `system-ui, -apple-system, sans-serif`.

| Role | Size | Weight | Line height | Token |
|---|---|---|---|---|
| Display | 28px | 400 | 36px | `--text-display` |
| Title large | 22px | 500 | 28px | `--text-title-lg` |
| Title | 16px | 500 | 24px | `--text-title` |
| Body | 14px | 400 | 20px | `--text-body` |
| Body small | 13px | 400 | 18px | `--text-body-sm` |
| Label | 12px | 500 | 16px | `--text-label` |
| Monospace | 13px | 400 | 18px | `--text-mono` (use for IDs, code) |

**Rules:**

- Use `--text-display` only for empty-state headlines and page-level hero headings.
- Do not use bold (`700`) weight in body copy. Use `500` (medium) for emphasis.
- Keep line lengths between 60–80 characters in reading areas (forms, detail views). Use `max-width` constraints on prose.
- Avoid all-caps except for table column headers and labels at `--text-label` size.

---

## 4. Spacing

Uses an 8px base grid. All margin, padding, and gap values must be multiples of 4px; prefer 8px increments.

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Inline gaps, icon-to-label spacing |
| `--space-2` | 8px | Inner padding for compact elements (chips, badges) |
| `--space-3` | 12px | — |
| `--space-4` | 16px | Default inner padding (cards, inputs) |
| `--space-6` | 24px | Section gaps within a panel |
| `--space-8` | 32px | Between major sections |
| `--space-12` | 48px | Page-level vertical rhythm |

---

## 5. Elevation & Borders

Avoid heavy drop shadows. Elevation is communicated primarily through background color contrast, not blur-heavy box shadows.

| Level | Usage | Style |
|---|---|---|
| 0 — flat | Page background | none |
| 1 — raised | Cards on dim background | `0 1px 2px rgba(0,0,0,0.08)` |
| 2 — floating | Dropdowns, popovers | `0 2px 8px rgba(0,0,0,0.12)` |
| 3 — modal | Dialogs, drawers | `0 8px 24px rgba(0,0,0,0.16)` |

Border radius:

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Chips, badges, tags |
| `--radius-md` | 8px | Inputs, buttons, small cards |
| `--radius-lg` | 12px | Cards, panels |
| `--radius-xl` | 16px | Modals, dialogs |
| `--radius-full` | 9999px | Pill buttons, avatar, FAB |

---

## 6. Layout & Navigation

### Shell structure

```
┌────────────────────────────────────────────┐
│  Top bar (mobile) / Sidebar rail (desktop) │
├────────────────────────────────────────────┤
│                                            │
│  Page content area                         │
│  max-width: 960px, centered with padding   │
│                                            │
└────────────────────────────────────────────┘
```

**Desktop (≥ 900px):** A fixed left sidebar rail (240px wide) holds the navigation links and the app name. The content area fills the remaining width, capped at `960px` with `auto` horizontal margins. The sidebar rail uses `--color-surface-dim` as background.

**Mobile (< 900px):** The sidebar collapses. A top app bar shows the current page title and a hamburger icon that opens a drawer. The drawer slides over the content with a scrim behind it.

### Navigation items

| Label | Route |
|---|---|
| Questions | `/questions` |
| Exams | `/exams` |
| Grading | `/grade` |

Active state: left accent bar (3px, `--color-primary`) + text in `--color-primary` + `--color-primary-surface` background on the nav item row.

### Page anatomy

Each page follows the same structure:

1. **Page header** — page title (`--text-title-lg`) + primary action button (top-right on desktop, full-width below header on mobile).
2. **Filter/search bar** (when applicable) — horizontally scrollable row of inputs and filter chips.
3. **Content region** — list, table, or form.
4. **Empty state** (when list is empty) — centered illustration placeholder + headline + CTA button.

---

## 7. Components

### Buttons

Three variants only:

| Variant | Usage | Style |
|---|---|---|
| Filled | Single primary action per page | `--color-primary` background, `--color-on-primary` text, `--radius-md` |
| Outlined | Secondary actions (cancel, back) | `--color-outline` border, `--color-on-surface` text, transparent background |
| Text/Ghost | Tertiary, destructive-confirm cancel | No border, no background; only on hover adds `--color-surface-container` background |

- Button height: 36px (compact) or 40px (default).
- Minimum tap target: 44×44px (use padding on smaller buttons).
- Icons inside buttons: 18px, left-aligned with 6px gap to label.
- Destructive actions (Delete): use outlined variant with `--color-error` text and border. Never use a filled red button unprompted.
- Loading state: replace button label with a 16px spinner; keep button width stable (no layout shift).

### Inputs

All text inputs, selects, and textareas share the same base:

- Background: `--color-surface-container`
- Border: 1px solid `--color-outline`, `--radius-md`
- Height: 40px (single-line); textarea has `min-height: 96px`
- Padding: `0 --space-4`
- Focus: border color changes to `--color-outline-focus`, no box-shadow glow
- Error state: border `--color-error`, error message in `--text-body-sm` with `--color-error` below the input
- Placeholder: `--color-on-surface-muted`
- Labels: `--text-label`, `--color-on-surface-muted`, displayed above the input (never floating)

### Cards

Used for list items and content panels.

- Background: `--color-surface`
- Border: 1px solid `--color-outline`
- Border radius: `--radius-lg`
- Padding: `--space-4` (compact list items) or `--space-6` (detail panels)
- Elevation: level 0 on `--color-surface-dim` backgrounds (border alone provides separation)
- Hover state on clickable cards: background transitions to `--color-surface-container`

### List rows (Questions / Exams)

Prefer a card-list layout over a traditional table on mobile; use a table on desktop.

**Desktop table:**
- Header row: `--text-label`, `--color-on-surface-muted`, `--color-surface-dim` background
- Row height: 52px
- Hover: `--color-surface-container` background
- Action column (Edit / Delete): hidden by default, revealed on row hover/focus. Right-aligned icon buttons.
- Pagination: centered below the table, previous/next arrows + page indicator

**Mobile card list:**
- Each item is a card with the primary field as the title and secondary metadata below
- Row-level actions available via a `⋮` overflow menu

### Chips (filter tags)

- Height: 28px, `--radius-full`
- Default: `--color-surface-container` background, `--color-on-surface` text
- Selected: `--color-primary-surface` background, `--color-primary` text, optional checkmark icon prefix
- Used for: status filters, identifier mode display

### Dialogs / Confirmation modals

- Max width: 400px
- Backdrop: `rgba(0,0,0,0.32)` scrim
- Border radius: `--radius-xl`
- Elevation: level 3
- Content: title (`--text-title`) + body (`--text-body`) + action row (right-aligned, outlined + filled buttons)
- Destructive confirmation: the confirm button uses outlined variant with `--color-error`; body text explicitly states the consequence

### Inline validation

- Validate on blur (not on every keystroke) for most fields.
- For the alternatives list in the question form, validate on submit and highlight the specific issue.
- Error messages appear directly below the relevant input, replacing helper text.
- A summary error banner at the top of the form is shown only on submit failure for multi-field forms.

### Toast notifications

- Position: bottom-center on mobile, bottom-right on desktop.
- Duration: 4 seconds, dismissible via × icon.
- Variants: success (green icon), error (red icon), info (blue icon).
- Max one toast visible at a time; queue additional ones.

### Progress / Loading

- For full-page data fetches: skeleton loaders matching the layout of the expected content (not a centered spinner).
- For in-place async actions (PDF generation, grading): inline progress indicator on the trigger button + an optional status message below.
- Never block the entire viewport with a full-screen loading overlay.

---

## 8. Key Screen Patterns

### Question list (`/questions`)

- Search input left-aligned in the filter bar; updates results on 300ms debounce.
- "New Question" button top-right.
- Each row: question statement (truncated to one line), number of alternatives, action icons on hover.
- Delete triggers an inline confirmation dialog, not page navigation.

### Question form (`/questions/new`, `/questions/:id/edit`)

- Single-column layout, max-width 640px.
- Statement: full-width textarea.
- Alternatives: a vertically stacked list of items. Each item has a text input + a "Correct" toggle (checkbox styled as a filled-dot indicator) + a remove icon. An "Add alternative" ghost button below the list.
- Correct alternatives are visually distinguished: a subtle `--color-success-surface` tint on the row.
- Save and Cancel buttons pinned to the bottom of the form on mobile (fixed footer bar).

### Exam form (`/exams/new`, `/exams/:id/edit`)

- Two-section layout on desktop (side-by-side): metadata fields on the left, question selector on the right.
- Stacked single-column on mobile.
- Question selector: searchable list of available questions. Selected questions appear in a separate "Added" list below (or in the right column on desktop) with drag handles for reordering.

### Exam detail (`/exams/:id`)

- Header card: exam metadata displayed in a definition-list grid (2 columns on desktop).
- "Generate Exams" section: a row with a number input (count) and a filled "Generate" button. Shows a progress indicator during generation.
- After generation: a banner with links to download PDF and CSV.
- "Generation history" section: compact table listing past batches (date, count, sequence range, download links).

### Grading tool (`/grade`)

- Two file upload zones side by side (answer key, student responses), each with a dashed border drop zone.
- Grading mode selector: two radio-style toggle chips (Strict / Lenient) with a brief explanatory tooltip on hover.
- "Grade" button becomes active only when both files are provided.
- Warnings (unmatched exam numbers) displayed inline as a yellow banner before the download link appears.

---

## 9. Responsive Breakpoints

| Breakpoint | Min-width | Layout changes |
|---|---|---|
| `sm` | 480px | Two-column grids where appropriate |
| `md` | 768px | Wider content padding, inline form sections |
| `lg` | 900px | Sidebar rail appears; content max-width enforced |
| `xl` | 1200px | Two-column exam form layout |

Use Tailwind CSS breakpoint prefixes (`sm:`, `md:`, `lg:`, `xl:`).

---

## 10. Iconography

Use **Google Material Symbols** (Rounded variant, 20px optical size, weight 400). Import only what is used.

Preferred icons:

| Action | Icon name |
|---|---|
| Add / New | `add` |
| Edit | `edit` |
| Delete | `delete` |
| Download | `download` |
| Upload / Import | `upload` |
| Search | `search` |
| Generate / Shuffle | `shuffle` |
| Grade / Score | `grading` |
| Questions | `quiz` |
| Exams | `article` |
| Expand more | `expand_more` |
| Close | `close` |
| Check / Correct | `check_circle` |
| Warning | `warning` |
| Error | `error` |

Icons are always paired with a visible label unless inside a dense action row where the action is unambiguous and a tooltip is provided.

---

## 11. Motion & Transitions

Keep motion subtle and functional, not decorative.

| Element | Transition |
|---|---|
| Button hover/focus | `background-color 120ms ease` |
| Card hover | `background-color 150ms ease` |
| Sidebar drawer open | `transform 200ms cubic-bezier(0.2,0,0,1)` |
| Toast enter/exit | `opacity + translateY 200ms ease` |
| Dialog open | `opacity + scale(0.95→1) 180ms ease` |
| Skeleton loader | pulsing opacity animation `1.2s ease-in-out infinite` |

No transition should exceed 300ms. Never animate layout properties (`height`, `width`) unless using fixed values. Use `prefers-reduced-motion` media query to disable all transitions for users who request it.

---

## 12. Accessibility

- All interactive elements must be keyboard navigable and have a visible focus indicator (2px `--color-primary` outline, `2px offset`).
- Color contrast must meet WCAG AA: 4.5:1 for body text, 3:1 for large text and UI components.
- All form inputs must have an associated `<label>` element (not just placeholder text).
- Icon-only buttons must have an `aria-label`.
- Dialogs must trap focus and restore it on close.
- Status messages (toasts, inline errors, progress updates) must be announced via `aria-live` regions.
