import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import { app } from "../../src/index";
import { generationBatches, resetDb } from "../../src/db";

beforeEach(() => resetDb());

// Helper: create a question and return its id
async function createQuestion() {
  const res = await request(app)
    .post("/api/questions")
    .send({
      statement: "Sample question?",
      alternatives: [
        { description: "Yes", correct: true },
        { description: "No", correct: false },
      ],
    });
  return res.body.id as string;
}

// Helper: create a valid exam body given question ids
function examBody(questionIds: string[], overrides = {}) {
  return {
    title: "Midterm",
    course: "Math 101",
    professor: "Dr. Smith",
    date: "2026-04-15",
    identifierMode: "letters",
    questions: questionIds,
    ...overrides,
  };
}

// --- GET /api/exams ---

describe("GET /api/exams", () => {
  it("returns empty list initially", async () => {
    const res = await request(app).get("/api/exams");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ data: [], page: 1, limit: 20, total: 0 });
  });

  it("returns created exams", async () => {
    const qId = await createQuestion();
    await request(app).post("/api/exams").send(examBody([qId]));
    await request(app).post("/api/exams").send(examBody([qId], { title: "Final" }));

    const res = await request(app).get("/api/exams");
    expect(res.body.total).toBe(2);
    expect(res.body.data).toHaveLength(2);
  });

  it("paginates correctly", async () => {
    const qId = await createQuestion();
    for (let i = 1; i <= 5; i++) {
      await request(app).post("/api/exams").send(examBody([qId], { title: `Exam ${i}` }));
    }

    const res = await request(app).get("/api/exams?page=2&limit=2");
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(2);
    expect(res.body.total).toBe(5);
    expect(res.body.data).toHaveLength(2);
  });
});

// --- POST /api/exams ---

describe("POST /api/exams", () => {
  it("creates an exam and returns 201", async () => {
    const qId = await createQuestion();
    const res = await request(app).post("/api/exams").send(examBody([qId]));
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe("Midterm");
    expect(res.body.questions).toEqual([qId]);
  });

  it("returns 400 when title is missing", async () => {
    const qId = await createQuestion();
    const res = await request(app).post("/api/exams").send(examBody([qId], { title: "" }));
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 when questions array is empty", async () => {
    const res = await request(app).post("/api/exams").send(examBody([]));
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 for unknown question id", async () => {
    const res = await request(app).post("/api/exams").send(examBody(["non-existent-uuid"]));
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 for invalid identifierMode", async () => {
    const qId = await createQuestion();
    const res = await request(app).post("/api/exams").send(examBody([qId], { identifierMode: "invalid" }));
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("accepts powers identifierMode", async () => {
    const qId = await createQuestion();
    const res = await request(app).post("/api/exams").send(examBody([qId], { identifierMode: "powers" }));
    expect(res.status).toBe(201);
    expect(res.body.identifierMode).toBe("powers");
  });
});

// --- GET /api/exams/:id ---

describe("GET /api/exams/:id", () => {
  it("returns the exam by id", async () => {
    const qId = await createQuestion();
    const created = await request(app).post("/api/exams").send(examBody([qId]));
    const res = await request(app).get(`/api/exams/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(created.body);
  });

  it("returns 404 for unknown id", async () => {
    const res = await request(app).get("/api/exams/non-existent");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

// --- PUT /api/exams/:id ---

describe("PUT /api/exams/:id", () => {
  it("updates and returns the exam", async () => {
    const qId = await createQuestion();
    const q2Id = await createQuestion();
    const created = await request(app).post("/api/exams").send(examBody([qId]));
    const update = examBody([q2Id], { title: "Final Exam", identifierMode: "powers" });

    const res = await request(app).put(`/api/exams/${created.body.id}`).send(update);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.title).toBe("Final Exam");
    expect(res.body.identifierMode).toBe("powers");
    expect(res.body.questions).toEqual([q2Id]);
  });

  it("returns 404 for unknown id", async () => {
    const qId = await createQuestion();
    const res = await request(app).put("/api/exams/no-such-id").send(examBody([qId]));
    expect(res.status).toBe(404);
  });

  it("returns 400 on invalid body", async () => {
    const qId = await createQuestion();
    const created = await request(app).post("/api/exams").send(examBody([qId]));
    const res = await request(app).put(`/api/exams/${created.body.id}`).send(examBody([qId], { title: "" }));
    expect(res.status).toBe(400);
  });
});

// --- DELETE /api/exams/:id ---

describe("DELETE /api/exams/:id", () => {
  it("deletes the exam and returns 204", async () => {
    const qId = await createQuestion();
    const created = await request(app).post("/api/exams").send(examBody([qId]));
    const del = await request(app).delete(`/api/exams/${created.body.id}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/api/exams/${created.body.id}`);
    expect(get.status).toBe(404);
  });

  it("returns 404 for unknown id", async () => {
    const res = await request(app).delete("/api/exams/ghost");
    expect(res.status).toBe(404);
  });

  it("returns 409 when the exam has generated batches", async () => {
    const qId = await createQuestion();
    const created = await request(app).post("/api/exams").send(examBody([qId]));
    const examId = created.body.id;

    generationBatches.push({
      id: "batch-1",
      examId,
      count: 5,
      generatedAt: "2026-04-01T10:00:00Z",
      sequenceNumberStart: 1,
    });

    const res = await request(app).delete(`/api/exams/${examId}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });
});
