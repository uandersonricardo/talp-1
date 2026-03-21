# API Reference

## Conventions

- **Base path**: `/api`
- **Content type**: `application/json` for all request bodies and responses (except file downloads and multipart uploads)
- **IDs**: UUID v4 strings
- **Dates**: ISO 8601 strings
- **Authentication**: none required

### Error format

All errors respond with:

```json
{ "error": "<message>" }
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error |
| 404 | Resource not found |
| 409 | Conflict (e.g. question referenced by an exam) |
| 500 | Server error |

---

## Data Models

### Alternative

```typescript
interface Alternative {
  description: string; // text of the alternative
  correct: boolean;    // whether this is a correct answer
}
```

### Question

```typescript
interface Question {
  id: string;                  // UUID v4
  statement: string;           // text of the question
  alternatives: Alternative[];
}
```

Validation: at least 2 alternatives; at least 1 must have `correct: true`.

### Exam

```typescript
interface Exam {
  id: string;
  title: string;
  course: string;       // appears in PDF header
  professor: string;    // appears in PDF header
  date: string;         // ISO 8601
  identifierMode: "letters" | "powers";
  questions: string[];  // ordered list of question IDs
}
```

Validation: at least 1 question.

**Identifier modes**

| Mode | Alternative labels | Answer format | Example |
|------|--------------------|---------------|---------|
| `letters` | A, B, C, D, … | selected letter(s) | `"B"`, `"AC"` |
| `powers` | 1, 2, 4, 8, 16, 32, … | sum of selected values | `5` (= 1 + 4) |

### GenerationBatch

```typescript
interface GenerationBatch {
  id: string;                  // UUID v4
  examId: string;
  count: number;               // number of individual exams generated
  generatedAt: string;         // ISO 8601
  sequenceNumberStart: number; // first sequence number assigned in this batch
}
```

### IndividualExam (internal artifact)

```typescript
interface IndividualExam {
  examId: string;
  sequenceNumber: number;
  questionOrder: string[];                     // shuffled question IDs
  alternativeOrders: Record<string, number[]>; // per-question shuffled alternative indices
}
```

---

## Endpoints

### Questions

#### `GET /api/questions`

List questions.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Filter by text in `statement` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Page size (default: implementation-defined) |

**Returns** `200`

```json
{
  "data": [Question],
  "page": 1,
  "limit": 20,
  "total": 100
}
```

---

#### `POST /api/questions`

Create a question.

**Body**

```json
{
  "statement": "What is 2 + 2?",
  "alternatives": [
    { "description": "3", "correct": false },
    { "description": "4", "correct": true }
  ]
}
```

**Returns** `201`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "statement": "What is 2 + 2?",
  "alternatives": [
    { "description": "3", "correct": false },
    { "description": "4", "correct": true }
  ]
}
```

---

#### `GET /api/questions/:id`

Get a question by ID.

**Returns** `200` — `Question` object, or `404`.

---

#### `PUT /api/questions/:id`

Replace a question.

**Body** — same shape as `POST /api/questions`.

**Returns** `200` — updated `Question`, or `404`.

---

#### `DELETE /api/questions/:id`

Delete a question.

**Returns** `204`, or `404`, or `409` if the question is referenced by an exam.

---

### Exams

#### `GET /api/exams`

List exams.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Page size |

**Returns** `200`

```json
{
  "data": [Exam],
  "page": 1,
  "limit": 20,
  "total": 10
}
```

---

#### `POST /api/exams`

Create an exam.

**Body**

```json
{
  "title": "Midterm Math",
  "course": "Calculus 101",
  "professor": "Dr. Smith",
  "date": "2026-04-15",
  "identifierMode": "letters",
  "questions": ["<question-id>", "<question-id>"]
}
```

**Returns** `201` — `Exam` object.

---

#### `GET /api/exams/:id`

Get an exam by ID.

**Returns** `200` — `Exam` object, or `404`.

---

#### `PUT /api/exams/:id`

Replace an exam.

**Body** — same shape as `POST /api/exams`.

**Returns** `200` — updated `Exam`, or `404`.

---

#### `DELETE /api/exams/:id`

Delete an exam.

**Returns** `204`, or `404`.

---

### Generation

#### `POST /api/exams/:id/generate`

Generate a batch of individual exams (shuffled variants) for the given exam, producing a PDF and an answer key CSV.

**Body**

```json
{ "count": 50 }
```

**Returns** `200`

```json
{
  "batchId": "<uuid>",
  "count": 50,
  "generatedAt": "2026-03-21T14:30:00Z",
  "pdfUrl": "/api/batches/<batchId>/pdf",
  "answersUrl": "/api/batches/<batchId>/answers.csv"
}
```

---

#### `GET /api/exams/:id/batches`

List all generation batches for an exam.

**Returns** `200`

```json
[GenerationBatch]
```

---

#### `GET /api/batches/:batchId/pdf`

Download the generated PDF for a batch.

**Returns** `200` — `application/pdf` file download, or `404`.

---

#### `GET /api/batches/:batchId/answers.csv`

Download the answer key CSV for a batch.

**Returns** `200` — `text/csv` file download, or `404`.

---

### Grading

#### `POST /api/grade`

Grade a set of student responses against an answer key.

**Body** — `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `answers` | file (CSV) | Answer key downloaded from `/api/batches/:batchId/answers.csv` |
| `responses` | file (CSV) | Student responses |
| `mode` | string | `"strict"` or `"lenient"` |

**Returns** `200` — grading report as a CSV file download.

---

## UI Structure

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/questions` |
| `/questions` | Question list with create button |
| `/questions/new` | Create question form |
| `/questions/:id/edit` | Edit question form |
| `/exams` | Exam list with create button |
| `/exams/new` | Create exam form (select questions, set identifier mode) |
| `/exams/:id` | Exam detail: metadata, generation history, generate button |
| `/exams/:id/edit` | Edit exam form |
| `/grade` | Grading tool: upload answer key + responses CSVs, select mode, download report |
