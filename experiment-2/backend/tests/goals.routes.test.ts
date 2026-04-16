import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/services/storage");

import app from "../src/app";
import * as storage from "../src/services/storage";

const GOAL_A = { id: "g-1", name: "Requisitos" };
const GOAL_B = { id: "g-2", name: "Testes" };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/goals", () => {
  it("returns all goals with status 200", async () => {
    vi.mocked(storage.readGoals).mockReturnValue([GOAL_A, GOAL_B]);

    const res = await request(app).get("/api/goals");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [GOAL_A, GOAL_B] });
  });

  it("returns an empty array when there are no goals", async () => {
    vi.mocked(storage.readGoals).mockReturnValue([]);

    const res = await request(app).get("/api/goals");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });
});

describe("POST /api/goals", () => {
  it("creates a goal and returns 201 with the new goal", async () => {
    vi.mocked(storage.readGoals).mockReturnValue([]);
    vi.mocked(storage.writeGoals).mockReturnValue(undefined);

    const res = await request(app).post("/api/goals").send({ name: "Requisitos" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: "Requisitos" });
    expect(res.body.data.id).toBeDefined();
  });

  it("persists the new goal via writeGoals", async () => {
    vi.mocked(storage.readGoals).mockReturnValue([GOAL_A]);
    vi.mocked(storage.writeGoals).mockReturnValue(undefined);

    await request(app).post("/api/goals").send({ name: "Testes" });

    const written = vi.mocked(storage.writeGoals).mock.calls[0][0];
    expect(written).toHaveLength(2);
    expect(written[0]).toEqual(GOAL_A);
    expect(written[1]).toMatchObject({ name: "Testes" });
  });

  it("trims whitespace from name", async () => {
    vi.mocked(storage.readGoals).mockReturnValue([]);
    vi.mocked(storage.writeGoals).mockReturnValue(undefined);

    const res = await request(app).post("/api/goals").send({ name: "  Requisitos  " });

    expect(res.body.data.name).toBe("Requisitos");
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app).post("/api/goals").send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when name is an empty string", async () => {
    const res = await request(app).post("/api/goals").send({ name: "   " });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("DELETE /api/goals/:id", () => {
  it("deletes a goal and returns the deleted goal", async () => {
    vi.mocked(storage.readGoals).mockReturnValue([GOAL_A, GOAL_B]);
    vi.mocked(storage.writeGoals).mockReturnValue(undefined);

    const res = await request(app).delete(`/api/goals/${GOAL_A.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: GOAL_A });
  });

  it("removes the goal from storage via writeGoals", async () => {
    vi.mocked(storage.readGoals).mockReturnValue([GOAL_A, GOAL_B]);
    vi.mocked(storage.writeGoals).mockReturnValue(undefined);

    await request(app).delete(`/api/goals/${GOAL_A.id}`);

    const written = vi.mocked(storage.writeGoals).mock.calls[0][0];
    expect(written).toHaveLength(1);
    expect(written[0]).toEqual(GOAL_B);
  });

  it("returns 404 when goal does not exist", async () => {
    vi.mocked(storage.readGoals).mockReturnValue([GOAL_A]);

    const res = await request(app).delete("/api/goals/nonexistent-id");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});
