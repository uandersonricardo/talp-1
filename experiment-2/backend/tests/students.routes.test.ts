import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/services/storage");

import app from "../src/app";
import * as storage from "../src/services/storage";

const STUDENT_A = { id: "abc-1", name: "Alice", cpf: "111.111.111-11", email: "alice@example.com" };
const STUDENT_B = { id: "abc-2", name: "Bob", cpf: "222.222.222-22", email: "bob@example.com" };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/students", () => {
  it("returns all students with status 200", async () => {
    vi.mocked(storage.readStudents).mockReturnValue([STUDENT_A, STUDENT_B]);

    const res = await request(app).get("/api/students");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [STUDENT_A, STUDENT_B] });
  });

  it("returns an empty array when there are no students", async () => {
    vi.mocked(storage.readStudents).mockReturnValue([]);

    const res = await request(app).get("/api/students");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });
});

describe("POST /api/students", () => {
  it("creates a student and returns 201 with the new student", async () => {
    vi.mocked(storage.readStudents).mockReturnValue([]);
    vi.mocked(storage.writeStudents).mockReturnValue(undefined);

    const res = await request(app)
      .post("/api/students")
      .send({ name: "Alice", cpf: "111.111.111-11", email: "alice@example.com" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      name: "Alice",
      cpf: "111.111.111-11",
      email: "alice@example.com",
    });
    expect(res.body.data.id).toBeDefined();
  });

  it("persists the new student via writeStudents", async () => {
    vi.mocked(storage.readStudents).mockReturnValue([STUDENT_A]);
    vi.mocked(storage.writeStudents).mockReturnValue(undefined);

    await request(app)
      .post("/api/students")
      .send({ name: "Bob", cpf: "222.222.222-22", email: "bob@example.com" });

    const written = vi.mocked(storage.writeStudents).mock.calls[0][0];
    expect(written).toHaveLength(2);
    expect(written[0]).toEqual(STUDENT_A);
    expect(written[1]).toMatchObject({ name: "Bob", cpf: "222.222.222-22", email: "bob@example.com" });
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/students")
      .send({ cpf: "111.111.111-11", email: "alice@example.com" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when cpf is missing", async () => {
    const res = await request(app).post("/api/students").send({ name: "Alice", email: "alice@example.com" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(app).post("/api/students").send({ name: "Alice", cpf: "111.111.111-11" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when body is empty", async () => {
    const res = await request(app).post("/api/students").send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("PUT /api/students/:id", () => {
  it("updates a student and returns the updated data", async () => {
    vi.mocked(storage.readStudents).mockReturnValue([STUDENT_A, STUDENT_B]);
    vi.mocked(storage.writeStudents).mockReturnValue(undefined);

    const res = await request(app)
      .put(`/api/students/${STUDENT_A.id}`)
      .send({ name: "Alice Updated", cpf: "111.111.111-11", email: "alice2@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      id: STUDENT_A.id,
      name: "Alice Updated",
      cpf: "111.111.111-11",
      email: "alice2@example.com",
    });
  });

  it("persists the change via writeStudents", async () => {
    vi.mocked(storage.readStudents).mockReturnValue([STUDENT_A]);
    vi.mocked(storage.writeStudents).mockReturnValue(undefined);

    await request(app)
      .put(`/api/students/${STUDENT_A.id}`)
      .send({ name: "Alice Updated", cpf: "111.111.111-11", email: "alice2@example.com" });

    const written = vi.mocked(storage.writeStudents).mock.calls[0][0];
    expect(written[0].name).toBe("Alice Updated");
  });

  it("returns 404 when student does not exist", async () => {
    vi.mocked(storage.readStudents).mockReturnValue([STUDENT_A]);

    const res = await request(app)
      .put("/api/students/nonexistent-id")
      .send({ name: "X", cpf: "000", email: "x@x.com" });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when required fields are missing", async () => {
    vi.mocked(storage.readStudents).mockReturnValue([STUDENT_A]);

    const res = await request(app).put(`/api/students/${STUDENT_A.id}`).send({ name: "Alice" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("DELETE /api/students/:id", () => {
  it("deletes a student and returns the deleted student", async () => {
    vi.mocked(storage.readStudents).mockReturnValue([STUDENT_A, STUDENT_B]);
    vi.mocked(storage.writeStudents).mockReturnValue(undefined);

    const res = await request(app).delete(`/api/students/${STUDENT_A.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: STUDENT_A });
  });

  it("removes the student from storage via writeStudents", async () => {
    vi.mocked(storage.readStudents).mockReturnValue([STUDENT_A, STUDENT_B]);
    vi.mocked(storage.writeStudents).mockReturnValue(undefined);

    await request(app).delete(`/api/students/${STUDENT_A.id}`);

    const written = vi.mocked(storage.writeStudents).mock.calls[0][0];
    expect(written).toHaveLength(1);
    expect(written[0]).toEqual(STUDENT_B);
  });

  it("returns 404 when student does not exist", async () => {
    vi.mocked(storage.readStudents).mockReturnValue([STUDENT_A]);

    const res = await request(app).delete("/api/students/nonexistent-id");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});
