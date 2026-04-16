import fs from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs");

import { readGoals, writeGoals } from "../src/services/storage";

const MOCK_GOALS = [
  { id: "g-1", name: "Requisitos" },
  { id: "g-2", name: "Testes" },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fs.existsSync).mockReturnValue(true);
});

describe("readGoals", () => {
  it("returns parsed goals when file exists", () => {
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(MOCK_GOALS) as any);

    const result = readGoals();

    expect(result).toEqual(MOCK_GOALS);
  });

  it("returns empty array when file does not exist", () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(true) // data dir exists
      .mockReturnValueOnce(false); // file does not exist

    const result = readGoals();

    expect(result).toEqual([]);
  });

  it("returns empty array when file contains invalid JSON", () => {
    vi.mocked(fs.readFileSync).mockReturnValue("not valid json" as any);

    const result = readGoals();

    expect(result).toEqual([]);
  });

  it("creates data directory when it does not exist", () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(false) // data dir does not exist
      .mockReturnValueOnce(false); // file does not exist

    readGoals();

    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });
});

describe("writeGoals", () => {
  it("writes goals as formatted JSON to goals.json", () => {
    writeGoals(MOCK_GOALS);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("goals.json"),
      JSON.stringify(MOCK_GOALS, null, 2),
      "utf-8",
    );
  });

  it("writes an empty array when given no goals", () => {
    writeGoals([]);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("goals.json"),
      JSON.stringify([], null, 2),
      "utf-8",
    );
  });
});
