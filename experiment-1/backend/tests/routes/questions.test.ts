import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import { app } from "../../src/index";
import { resetDb } from "../../src/db";

const validBody = {
  statement: "What is 2 + 2?",
  alternatives: [
    { description: "3", correct: false },
    { description: "4", correct: true },
  ],
};

beforeEach(() => resetDb());

// --- GET /api/questions ---

describe("GET /api/questions", () => {
  it("returns empty list initially", async () => {
    const res = await request(app).get("/api/questions");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ data: [], page: 1, limit: 20, total: 0 });
  });

  it("returns created questions", async () => {
    await request(app).post("/api/questions").send(validBody);
    await request(app)
      .post("/api/questions")
      .send({ ...validBody, statement: "Q2" });

    const res = await request(app).get("/api/questions");
    expect(res.body.total).toBe(2);
    expect(res.body.data).toHaveLength(2);
  });

  it("filters by search param (case-insensitive)", async () => {
    await request(app).post("/api/questions").send(validBody);
    await request(app)
      .post("/api/questions")
      .send({ ...validBody, statement: "Who wrote Hamlet?" });

    const res = await request(app).get("/api/questions?search=hamlet");
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].statement).toMatch(/Hamlet/);
  });

  it("paginates correctly", async () => {
    for (let i = 1; i <= 5; i++) {
      await request(app)
        .post("/api/questions")
        .send({ ...validBody, statement: `Question ${i}` });
    }

    const res = await request(app).get("/api/questions?page=2&limit=2");
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(2);
    expect(res.body.total).toBe(5);
    expect(res.body.data).toHaveLength(2);
  });
});

// --- POST /api/questions ---

describe("POST /api/questions", () => {
  it("creates a question and returns 201", async () => {
    const res = await request(app).post("/api/questions").send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.statement).toBe(validBody.statement);
    expect(res.body.alternatives).toEqual(validBody.alternatives);
  });

  it("returns 400 when statement is missing", async () => {
    const res = await request(app).post("/api/questions").send({ alternatives: validBody.alternatives });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 when fewer than 2 alternatives", async () => {
    const res = await request(app)
      .post("/api/questions")
      .send({ statement: "Q?", alternatives: [{ description: "Only one", correct: true }] });
    expect(res.status).toBe(400);
  });

  it("returns 400 when no alternative is correct", async () => {
    const res = await request(app)
      .post("/api/questions")
      .send({
        statement: "Q?",
        alternatives: [
          { description: "A", correct: false },
          { description: "B", correct: false },
        ],
      });
    expect(res.status).toBe(400);
  });
});

// --- GET /api/questions/:id ---

describe("GET /api/questions/:id", () => {
  it("returns the question by id", async () => {
    const created = await request(app).post("/api/questions").send(validBody);
    const res = await request(app).get(`/api/questions/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(created.body);
  });

  it("returns 404 for unknown id", async () => {
    const res = await request(app).get("/api/questions/non-existent");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

// --- PUT /api/questions/:id ---

describe("PUT /api/questions/:id", () => {
  it("updates and returns the question", async () => {
    const created = await request(app).post("/api/questions").send(validBody);
    const update = {
      statement: "Updated?",
      alternatives: [
        { description: "Yes", correct: true },
        { description: "No", correct: false },
      ],
    };

    const res = await request(app).put(`/api/questions/${created.body.id}`).send(update);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.statement).toBe("Updated?");
  });

  it("returns 404 for unknown id", async () => {
    const res = await request(app).put("/api/questions/no-such-id").send(validBody);
    expect(res.status).toBe(404);
  });

  it("returns 400 on invalid body", async () => {
    const created = await request(app).post("/api/questions").send(validBody);
    const res = await request(app)
      .put(`/api/questions/${created.body.id}`)
      .send({ statement: "", alternatives: validBody.alternatives });
    expect(res.status).toBe(400);
  });
});

// --- DELETE /api/questions/:id ---

describe("DELETE /api/questions/:id", () => {
  it("deletes the question and returns 204", async () => {
    const created = await request(app).post("/api/questions").send(validBody);
    const del = await request(app).delete(`/api/questions/${created.body.id}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/api/questions/${created.body.id}`);
    expect(get.status).toBe(404);
  });

  it("returns 404 for unknown id", async () => {
    const res = await request(app).delete("/api/questions/ghost");
    expect(res.status).toBe(404);
  });
});
