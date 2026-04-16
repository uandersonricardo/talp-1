import fs from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs");

import { readStudents, writeStudents } from "../src/services/storage";

const MOCK_STUDENTS = [
  { id: "1", name: "Alice", cpf: "111.111.111-11", email: "alice@example.com" },
  { id: "2", name: "Bob", cpf: "222.222.222-22", email: "bob@example.com" },
];

beforeEach(() => {
  vi.resetAllMocks();
  // Data directory always exists by default
  vi.mocked(fs.existsSync).mockReturnValue(true);
});

describe("readStudents", () => {
  it("returns parsed students when file exists", () => {
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(MOCK_STUDENTS) as any);

    const result = readStudents();

    expect(result).toEqual(MOCK_STUDENTS);
  });

  it("returns empty array when file does not exist", () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(true) // data dir exists
      .mockReturnValueOnce(false); // file does not exist

    const result = readStudents();

    expect(result).toEqual([]);
  });

  it("returns empty array when file contains invalid JSON", () => {
    vi.mocked(fs.readFileSync).mockReturnValue("not valid json" as any);

    const result = readStudents();

    expect(result).toEqual([]);
  });

  it("creates data directory when it does not exist", () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(false) // data dir does not exist
      .mockReturnValueOnce(false); // file does not exist

    readStudents();

    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });
});

describe("writeStudents", () => {
  it("writes students as formatted JSON to students.json", () => {
    writeStudents(MOCK_STUDENTS);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("students.json"),
      JSON.stringify(MOCK_STUDENTS, null, 2),
      "utf-8",
    );
  });

  it("writes an empty array when given no students", () => {
    writeStudents([]);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("students.json"),
      JSON.stringify([], null, 2),
      "utf-8",
    );
  });
});
