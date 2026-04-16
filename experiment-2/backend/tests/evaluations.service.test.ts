import fs from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs");

import { readEvaluations, writeEvaluations } from "../src/services/storage";

const MOCK_EVALUATIONS = [
  { id: "e-1", classId: "cls-1", studentId: "s-1", goalId: "g-1", grade: "MA" as const, updatedAt: "2026-04-16T10:00:00.000Z" },
  { id: "e-2", classId: "cls-1", studentId: "s-2", goalId: "g-1", grade: "MPA" as const, updatedAt: "2026-04-16T11:00:00.000Z" },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fs.existsSync).mockReturnValue(true);
});

describe("readEvaluations", () => {
  it("returns parsed evaluations when file exists", () => {
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(MOCK_EVALUATIONS) as any);

    const result = readEvaluations();

    expect(result).toEqual(MOCK_EVALUATIONS);
  });

  it("returns empty array when file does not exist", () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(true) // data dir exists
      .mockReturnValueOnce(false); // file does not exist

    const result = readEvaluations();

    expect(result).toEqual([]);
  });

  it("returns empty array when file contains invalid JSON", () => {
    vi.mocked(fs.readFileSync).mockReturnValue("not valid json" as any);

    const result = readEvaluations();

    expect(result).toEqual([]);
  });
});

describe("writeEvaluations", () => {
  it("writes evaluations as formatted JSON to evaluations.json", () => {
    writeEvaluations(MOCK_EVALUATIONS);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("evaluations.json"),
      JSON.stringify(MOCK_EVALUATIONS, null, 2),
      "utf-8",
    );
  });

  it("writes an empty array when given no evaluations", () => {
    writeEvaluations([]);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("evaluations.json"),
      JSON.stringify([], null, 2),
      "utf-8",
    );
  });
});
