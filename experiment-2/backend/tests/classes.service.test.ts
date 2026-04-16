import fs from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs");

import { readClasses, writeClasses } from "../src/services/storage";

const MOCK_CLASSES = [
  { id: "cls-1", description: "Introdução à Programação", year: 2024, semester: 1 as const, studentIds: [] },
  { id: "cls-2", description: "Estruturas de Dados", year: 2024, semester: 2 as const, studentIds: ["s-1"] },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fs.existsSync).mockReturnValue(true);
});

describe("readClasses", () => {
  it("returns parsed classes when file exists", () => {
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(MOCK_CLASSES) as any);

    const result = readClasses();

    expect(result).toEqual(MOCK_CLASSES);
  });

  it("returns empty array when file does not exist", () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(true) // data dir exists
      .mockReturnValueOnce(false); // file does not exist

    const result = readClasses();

    expect(result).toEqual([]);
  });

  it("returns empty array when file contains invalid JSON", () => {
    vi.mocked(fs.readFileSync).mockReturnValue("not valid json" as any);

    const result = readClasses();

    expect(result).toEqual([]);
  });

  it("creates data directory when it does not exist", () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(false) // data dir does not exist
      .mockReturnValueOnce(false); // file does not exist

    readClasses();

    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });
});

describe("writeClasses", () => {
  it("writes classes as formatted JSON to classes.json", () => {
    writeClasses(MOCK_CLASSES);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("classes.json"),
      JSON.stringify(MOCK_CLASSES, null, 2),
      "utf-8",
    );
  });

  it("writes an empty array when given no classes", () => {
    writeClasses([]);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("classes.json"),
      JSON.stringify([], null, 2),
      "utf-8",
    );
  });
});
