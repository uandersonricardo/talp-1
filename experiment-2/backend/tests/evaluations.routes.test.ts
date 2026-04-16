import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/services/storage");
vi.mock("../src/services/emailQueue");

import app from "../src/app";
import * as emailQueue from "../src/services/emailQueue";
import * as storage from "../src/services/storage";

const CLASS_A = { id: "cls-1", description: "Introdução à Programação", year: 2024, semester: 1 as const, studentIds: ["s-1", "s-2"] };

const EVAL_1 = { id: "e-1", classId: "cls-1", studentId: "s-1", goalId: "g-1", grade: "MA" as const, updatedAt: "2026-04-16T10:00:00.000Z" };
const EVAL_2 = { id: "e-2", classId: "cls-1", studentId: "s-2", goalId: "g-1", grade: "MPA" as const, updatedAt: "2026-04-16T11:00:00.000Z" };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/classes/:classId/evaluations", () => {
  it("returns all evaluations for the given class", async () => {
    vi.mocked(storage.readEvaluations).mockReturnValue([EVAL_1, EVAL_2]);

    const res = await request(app).get(`/api/classes/${CLASS_A.id}/evaluations`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [EVAL_1, EVAL_2] });
  });

  it("returns only evaluations belonging to the requested class", async () => {
    const otherEval = { ...EVAL_1, id: "e-3", classId: "cls-other" };
    vi.mocked(storage.readEvaluations).mockReturnValue([EVAL_1, otherEval]);

    const res = await request(app).get(`/api/classes/${CLASS_A.id}/evaluations`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(EVAL_1.id);
  });

  it("returns an empty array when there are no evaluations for the class", async () => {
    vi.mocked(storage.readEvaluations).mockReturnValue([]);

    const res = await request(app).get("/api/classes/cls-unknown/evaluations");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });
});

describe("PUT /api/classes/:classId/evaluations", () => {
  it("creates a new evaluation and returns 201", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);
    vi.mocked(storage.readEvaluations).mockReturnValue([]);
    vi.mocked(storage.writeEvaluations).mockReturnValue(undefined);
    vi.mocked(emailQueue.enqueue).mockReturnValue(undefined);

    const res = await request(app)
      .put(`/api/classes/${CLASS_A.id}/evaluations`)
      .send({ studentId: "s-1", goalId: "g-1", grade: "MA" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ classId: CLASS_A.id, studentId: "s-1", goalId: "g-1", grade: "MA" });
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.updatedAt).toBeDefined();
  });

  it("updates an existing evaluation and returns 200", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);
    vi.mocked(storage.readEvaluations).mockReturnValue([EVAL_1]);
    vi.mocked(storage.writeEvaluations).mockReturnValue(undefined);
    vi.mocked(emailQueue.enqueue).mockReturnValue(undefined);

    const res = await request(app)
      .put(`/api/classes/${CLASS_A.id}/evaluations`)
      .send({ studentId: EVAL_1.studentId, goalId: EVAL_1.goalId, grade: "MANA" });

    expect(res.status).toBe(200);
    expect(res.body.data.grade).toBe("MANA");
    expect(res.body.data.id).toBe(EVAL_1.id);
  });

  it("persists the evaluation via writeEvaluations", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);
    vi.mocked(storage.readEvaluations).mockReturnValue([]);
    vi.mocked(storage.writeEvaluations).mockReturnValue(undefined);
    vi.mocked(emailQueue.enqueue).mockReturnValue(undefined);

    await request(app)
      .put(`/api/classes/${CLASS_A.id}/evaluations`)
      .send({ studentId: "s-1", goalId: "g-1", grade: "MPA" });

    expect(storage.writeEvaluations).toHaveBeenCalledOnce();
    const written = vi.mocked(storage.writeEvaluations).mock.calls[0][0];
    expect(written[0]).toMatchObject({ studentId: "s-1", goalId: "g-1", grade: "MPA" });
  });

  it("calls enqueue after saving the evaluation", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);
    vi.mocked(storage.readEvaluations).mockReturnValue([]);
    vi.mocked(storage.writeEvaluations).mockReturnValue(undefined);
    vi.mocked(emailQueue.enqueue).mockReturnValue(undefined);

    await request(app)
      .put(`/api/classes/${CLASS_A.id}/evaluations`)
      .send({ studentId: "s-1", goalId: "g-1", grade: "MA" });

    expect(emailQueue.enqueue).toHaveBeenCalledOnce();
    expect(emailQueue.enqueue).toHaveBeenCalledWith("s-1", CLASS_A.id, "g-1", "MA");
  });

  it("returns 404 when class does not exist", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);

    const res = await request(app)
      .put("/api/classes/nonexistent-cls/evaluations")
      .send({ studentId: "s-1", goalId: "g-1", grade: "MA" });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when studentId is missing", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);

    const res = await request(app)
      .put(`/api/classes/${CLASS_A.id}/evaluations`)
      .send({ goalId: "g-1", grade: "MA" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when goalId is missing", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);

    const res = await request(app)
      .put(`/api/classes/${CLASS_A.id}/evaluations`)
      .send({ studentId: "s-1", grade: "MA" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when grade is invalid", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);

    const res = await request(app)
      .put(`/api/classes/${CLASS_A.id}/evaluations`)
      .send({ studentId: "s-1", goalId: "g-1", grade: "INVALID" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
