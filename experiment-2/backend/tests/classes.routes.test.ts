import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/services/storage");

import app from "../src/app";
import * as storage from "../src/services/storage";

const CLASS_A = { id: "cls-1", description: "Introdução à Programação", year: 2024, semester: 1 as const, studentIds: [] };
const CLASS_B = { id: "cls-2", description: "Estruturas de Dados", year: 2024, semester: 2 as const, studentIds: ["s-1"] };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/classes", () => {
  it("returns all classes with status 200", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A, CLASS_B]);

    const res = await request(app).get("/api/classes");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [CLASS_A, CLASS_B] });
  });

  it("returns an empty array when there are no classes", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([]);

    const res = await request(app).get("/api/classes");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });
});

describe("POST /api/classes", () => {
  it("creates a class and returns 201 with the new class", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([]);
    vi.mocked(storage.writeClasses).mockReturnValue(undefined);

    const res = await request(app)
      .post("/api/classes")
      .send({ description: "Introdução à Programação", year: 2024, semester: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ description: "Introdução à Programação", year: 2024, semester: 1, studentIds: [] });
    expect(res.body.data.id).toBeDefined();
  });

  it("persists the new class via writeClasses", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);
    vi.mocked(storage.writeClasses).mockReturnValue(undefined);

    await request(app).post("/api/classes").send({ description: "Novas Turmas", year: 2025, semester: 2 });

    const written = vi.mocked(storage.writeClasses).mock.calls[0][0];
    expect(written).toHaveLength(2);
    expect(written[0]).toEqual(CLASS_A);
    expect(written[1]).toMatchObject({ description: "Novas Turmas", year: 2025, semester: 2, studentIds: [] });
  });

  it("returns 400 when description is missing", async () => {
    const res = await request(app).post("/api/classes").send({ year: 2024, semester: 1 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when year is missing", async () => {
    const res = await request(app).post("/api/classes").send({ description: "Programação", semester: 1 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when semester is invalid", async () => {
    const res = await request(app).post("/api/classes").send({ description: "Programação", year: 2024, semester: 3 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("PUT /api/classes/:id", () => {
  it("updates a class and returns the updated data", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A, CLASS_B]);
    vi.mocked(storage.writeClasses).mockReturnValue(undefined);

    const res = await request(app)
      .put(`/api/classes/${CLASS_A.id}`)
      .send({ description: "Programação Avançada", year: 2025, semester: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ ...CLASS_A, description: "Programação Avançada", year: 2025, semester: 2 });
  });

  it("persists the change via writeClasses", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);
    vi.mocked(storage.writeClasses).mockReturnValue(undefined);

    await request(app).put(`/api/classes/${CLASS_A.id}`).send({ description: "Atualizado", year: 2025, semester: 1 });

    const written = vi.mocked(storage.writeClasses).mock.calls[0][0];
    expect(written[0].description).toBe("Atualizado");
  });

  it("returns 404 when class does not exist", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);

    const res = await request(app)
      .put("/api/classes/nonexistent-id")
      .send({ description: "X", year: 2024, semester: 1 });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when required fields are missing", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);

    const res = await request(app).put(`/api/classes/${CLASS_A.id}`).send({ description: "Só descrição" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("DELETE /api/classes/:id", () => {
  it("deletes a class and returns the deleted class", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A, CLASS_B]);
    vi.mocked(storage.writeClasses).mockReturnValue(undefined);

    const res = await request(app).delete(`/api/classes/${CLASS_A.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: CLASS_A });
  });

  it("removes the class from storage via writeClasses", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A, CLASS_B]);
    vi.mocked(storage.writeClasses).mockReturnValue(undefined);

    await request(app).delete(`/api/classes/${CLASS_A.id}`);

    const written = vi.mocked(storage.writeClasses).mock.calls[0][0];
    expect(written).toHaveLength(1);
    expect(written[0]).toEqual(CLASS_B);
  });

  it("returns 404 when class does not exist", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);

    const res = await request(app).delete("/api/classes/nonexistent-id");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

describe("POST /api/classes/:id/students/:studentId", () => {
  it("enrolls a student and returns the updated class", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);
    vi.mocked(storage.writeClasses).mockReturnValue(undefined);

    const res = await request(app).post(`/api/classes/${CLASS_A.id}/students/s-99`);

    expect(res.status).toBe(200);
    expect(res.body.data.studentIds).toContain("s-99");
  });

  it("persists the enrollment via writeClasses", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);
    vi.mocked(storage.writeClasses).mockReturnValue(undefined);

    await request(app).post(`/api/classes/${CLASS_A.id}/students/s-99`);

    const written = vi.mocked(storage.writeClasses).mock.calls[0][0];
    expect(written[0].studentIds).toContain("s-99");
  });

  it("returns 404 when class does not exist", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);

    const res = await request(app).post("/api/classes/nonexistent-id/students/s-99");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 409 when student is already enrolled", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_B]); // CLASS_B has studentId "s-1"

    const res = await request(app).post(`/api/classes/${CLASS_B.id}/students/s-1`);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("error");
  });
});

describe("DELETE /api/classes/:id/students/:studentId", () => {
  it("unenrolls a student and returns the updated class", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_B]); // CLASS_B has studentId "s-1"
    vi.mocked(storage.writeClasses).mockReturnValue(undefined);

    const res = await request(app).delete(`/api/classes/${CLASS_B.id}/students/s-1`);

    expect(res.status).toBe(200);
    expect(res.body.data.studentIds).not.toContain("s-1");
  });

  it("persists the unenrollment via writeClasses", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_B]);
    vi.mocked(storage.writeClasses).mockReturnValue(undefined);

    await request(app).delete(`/api/classes/${CLASS_B.id}/students/s-1`);

    const written = vi.mocked(storage.writeClasses).mock.calls[0][0];
    expect(written[0].studentIds).not.toContain("s-1");
  });

  it("returns 404 when class does not exist", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]);

    const res = await request(app).delete("/api/classes/nonexistent-id/students/s-1");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 404 when student is not enrolled", async () => {
    vi.mocked(storage.readClasses).mockReturnValue([CLASS_A]); // CLASS_A has no students

    const res = await request(app).delete(`/api/classes/${CLASS_A.id}/students/s-99`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});
