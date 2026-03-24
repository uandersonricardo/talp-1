import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import { app } from "../../src/index";
import { resetDb } from "../../src/db";

beforeEach(() => resetDb());

// Helpers

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

async function createExam(questionIds: string[], overrides = {}) {
  const res = await request(app)
    .post("/api/exams")
    .send({
      title: "Midterm",
      course: "Math 101",
      professor: "Dr. Smith",
      date: "2026-04-15",
      identifierMode: "letters",
      questions: questionIds,
      ...overrides,
    });
  return res.body.id as string;
}

// --- POST /api/exams/:id/generate ---

describe("POST /api/exams/:id/generate", () => {
  it("returns 200 with correct response shape", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const res = await request(app).post(`/api/exams/${examId}/generate`).send({ count: 2 });
    expect(res.status).toBe(200);
    expect(res.body.batchId).toBeDefined();
    expect(res.body.count).toBe(2);
    expect(res.body.generatedAt).toBeDefined();
    expect(res.body.pdfUrl).toMatch(/\/api\/batches\/.+\/pdf$/);
    expect(res.body.answersUrl).toMatch(/\/api\/batches\/.+\/answers\.csv$/);
  });

  it("returns 404 for unknown exam id", async () => {
    const res = await request(app).post("/api/exams/non-existent/generate").send({ count: 1 });
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 for count = 0", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const res = await request(app).post(`/api/exams/${examId}/generate`).send({ count: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 for non-integer count", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const res = await request(app).post(`/api/exams/${examId}/generate`).send({ count: 2.5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 for missing count", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const res = await request(app).post(`/api/exams/${examId}/generate`).send({});
    expect(res.status).toBe(400);
  });

  it("successive batches have incrementing sequence numbers", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    await request(app).post(`/api/exams/${examId}/generate`).send({ count: 3 });
    await request(app).post(`/api/exams/${examId}/generate`).send({ count: 2 });

    const batches = await request(app).get(`/api/exams/${examId}/batches`);
    expect(batches.body[0].sequenceNumberStart).toBe(1);
    expect(batches.body[1].sequenceNumberStart).toBe(4);
  });
});

// --- GET /api/exams/:id/batches ---

describe("GET /api/exams/:id/batches", () => {
  it("returns empty array when no batches exist", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const res = await request(app).get(`/api/exams/${examId}/batches`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns batches after generation with correct fields", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    await request(app).post(`/api/exams/${examId}/generate`).send({ count: 2 });

    const res = await request(app).get(`/api/exams/${examId}/batches`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].examId).toBe(examId);
    expect(res.body[0].count).toBe(2);
    expect(res.body[0].id).toBeDefined();
    expect(res.body[0].generatedAt).toBeDefined();
    expect(res.body[0].sequenceNumberStart).toBe(1);
  });

  it("returns 404 for unknown exam", async () => {
    const res = await request(app).get("/api/exams/non-existent/batches");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it("lists multiple batches in insertion order", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    await request(app).post(`/api/exams/${examId}/generate`).send({ count: 1 });
    await request(app).post(`/api/exams/${examId}/generate`).send({ count: 5 });

    const res = await request(app).get(`/api/exams/${examId}/batches`);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].count).toBe(1);
    expect(res.body[1].count).toBe(5);
  });
});

// --- GET /api/batches/:batchId/pdf ---

describe("GET /api/batches/:batchId/pdf", () => {
  it("returns 200 with application/pdf content-type", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const gen = await request(app).post(`/api/exams/${examId}/generate`).send({ count: 1 });
    const batchId = gen.body.batchId;

    const res = await request(app).get(`/api/batches/${batchId}/pdf`).buffer(true);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect(res.headers["content-disposition"]).toContain("attachment");
  });

  it("PDF starts with the %PDF magic bytes", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const gen = await request(app).post(`/api/exams/${examId}/generate`).send({ count: 1 });
    const batchId = gen.body.batchId;

    const res = await request(app)
      .get(`/api/batches/${batchId}/pdf`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
      });
    expect(res.body.slice(0, 4).toString()).toBe("%PDF");
  });

  it("returns 404 for unknown batchId", async () => {
    const res = await request(app).get("/api/batches/non-existent/pdf");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

// --- GET /api/batches/:batchId/answers.csv ---

describe("GET /api/batches/:batchId/answers.csv", () => {
  it("returns 200 with text/csv content-type", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const gen = await request(app).post(`/api/exams/${examId}/generate`).send({ count: 2 });
    const batchId = gen.body.batchId;

    const res = await request(app).get(`/api/batches/${batchId}/answers.csv`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("attachment");
  });

  it("CSV has header row and one row per generated exam", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const gen = await request(app).post(`/api/exams/${examId}/generate`).send({ count: 3 });
    const batchId = gen.body.batchId;

    const res = await request(app).get(`/api/batches/${batchId}/answers.csv`);
    const lines = res.text.split("\n").filter(Boolean);
    expect(lines).toHaveLength(4); // 1 header + 3 data rows
    expect(lines[0]).toContain("exam_number");
  });

  it("CSV header includes question IDs in canonical order", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const gen = await request(app).post(`/api/exams/${examId}/generate`).send({ count: 1 });
    const batchId = gen.body.batchId;

    const res = await request(app).get(`/api/batches/${batchId}/answers.csv`);
    const header = res.text.split("\n")[0];
    expect(header).toBe(`exam_number,Q1`);
  });

  it("returns 404 for unknown batchId", async () => {
    const res = await request(app).get("/api/batches/non-existent/answers.csv");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
