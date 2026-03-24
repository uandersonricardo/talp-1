import { beforeEach, describe, expect, it } from "vitest";

import { resetDb } from "../../src/db";
import { createExam } from "../../src/services/examService";
import { gradeResponses } from "../../src/services/gradingService";
import { ServiceError, createQuestion } from "../../src/services/questionService";

beforeEach(() => resetDb());

// --- Helpers ---

function makeQuestion(alts = [{ description: "Yes", correct: true }, { description: "No", correct: false }]) {
  return createQuestion("Sample?", alts);
}

function makeExam(questionIds: string[], mode: "letters" | "powers" = "letters") {
  return createExam("Midterm", "Math", "Dr. X", "2026-04-15", mode, questionIds);
}

// Build a simple answer key CSV manually
function buildKeyCSV(questionIds: string[], rows: { examNum: number; answers: string[] }[]) {
  const header = ["exam_number", ...questionIds].join(",");
  const dataRows = rows.map((r) => [r.examNum, ...r.answers].join(","));
  return [header, ...dataRows].join("\n");
}

// Build a simple responses CSV manually
function buildResponsesCSV(
  cols: string[],
  rows: (string | number)[][],
) {
  return [cols.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

// --- gradeResponses: input validation ---

describe("gradeResponses: input validation", () => {
  it("throws 400 for invalid mode", () => {
    const key = buildKeyCSV(["q1"], [{ examNum: 1, answers: ["A"] }]);
    const responses = buildResponsesCSV(["exam_number", "q1"], [[1, "A"]]);
    expect(() => gradeResponses(key, responses, "wrong" as any)).toThrowError(
      expect.objectContaining({ statusCode: 400 }),
    );
  });

  it("throws 400 for empty answer key", () => {
    const responses = buildResponsesCSV(["exam_number", "q1"], [[1, "A"]]);
    expect(() => gradeResponses("", responses, "strict")).toThrowError(
      expect.objectContaining({ statusCode: 400 }),
    );
  });

  it("throws 400 for empty responses CSV", () => {
    const key = buildKeyCSV(["q1"], [{ examNum: 1, answers: ["A"] }]);
    expect(() => gradeResponses(key, "", "strict")).toThrowError(
      expect.objectContaining({ statusCode: 400 }),
    );
  });
});

// --- gradeResponses: strict mode ---

describe("gradeResponses: strict mode", () => {
  it("scores 1 for exact match", () => {
    const key = buildKeyCSV(["q1"], [{ examNum: 1, answers: ["A"] }]);
    const responses = buildResponsesCSV(["exam_number", "q1"], [[1, "A"]]);
    const report = gradeResponses(key, responses, "strict");
    const rows = report.split("\n");
    expect(rows).toHaveLength(2);
    expect(rows[1]).toBe("1,1,1");
  });

  it("scores 0 for mismatch", () => {
    const key = buildKeyCSV(["q1"], [{ examNum: 1, answers: ["A"] }]);
    const responses = buildResponsesCSV(["exam_number", "q1"], [[1, "B"]]);
    const report = gradeResponses(key, responses, "strict");
    const row = report.split("\n")[1];
    expect(row).toBe("1,0,0");
  });

  it("scores 0 for empty student answer", () => {
    const key = buildKeyCSV(["q1"], [{ examNum: 1, answers: ["A"] }]);
    const responses = buildResponsesCSV(["exam_number", "q1"], [[1, ""]]);
    const report = gradeResponses(key, responses, "strict");
    const row = report.split("\n")[1];
    expect(row).toBe("1,0,0");
  });

  it("comparison is case-insensitive", () => {
    const key = buildKeyCSV(["q1"], [{ examNum: 1, answers: ["AC"] }]);
    const responses = buildResponsesCSV(["exam_number", "q1"], [[1, "ac"]]);
    const report = gradeResponses(key, responses, "strict");
    const row = report.split("\n")[1];
    expect(row).toBe("1,1,1");
  });

  it("total_score is sum of per-question scores", () => {
    const key = buildKeyCSV(["q1", "q2"], [{ examNum: 1, answers: ["A", "B"] }]);
    const responses = buildResponsesCSV(["exam_number", "q1", "q2"], [[1, "A", "C"]]);
    const report = gradeResponses(key, responses, "strict");
    const row = report.split("\n")[1].split(",");
    expect(row[3]).toBe("1"); // total: q1=1, q2=0 → 1
  });

  it("skips rows with no exam_number", () => {
    const key = buildKeyCSV(["q1"], [{ examNum: 1, answers: ["A"] }]);
    const responses = buildResponsesCSV(["exam_number", "q1"], [["", "A"]]);
    const report = gradeResponses(key, responses, "strict");
    const rows = report.split("\n");
    expect(rows).toHaveLength(1); // header only
  });

  it("warns but does not fail when exam_number is missing from key", () => {
    const key = buildKeyCSV(["q1"], [{ examNum: 1, answers: ["A"] }]);
    const responses = buildResponsesCSV(["exam_number", "q1"], [[99, "A"]]);
    expect(() => gradeResponses(key, responses, "strict")).not.toThrow();
    const report = gradeResponses(key, responses, "strict");
    const row = report.split("\n")[1];
    expect(row.startsWith("99")).toBe(true);
    // Unmatched → all 0 scores
    expect(row).toBe("99,0,0");
  });

  it("includes student_name in output when column is present", () => {
    const key = buildKeyCSV(["q1"], [{ examNum: 1, answers: ["A"] }]);
    const responses = buildResponsesCSV(["exam_number", "student_name", "q1"], [[1, "Alice", "A"]]);
    const report = gradeResponses(key, responses, "strict");
    const [header, row] = report.split("\n");
    expect(header).toContain("student_name");
    expect(row).toBe("1,Alice,1,1");
  });

  it("includes cpf in output when column is present", () => {
    const key = buildKeyCSV(["q1"], [{ examNum: 1, answers: ["A"] }]);
    const responses = buildResponsesCSV(["exam_number", "cpf", "q1"], [[1, "12345678900", "A"]]);
    const report = gradeResponses(key, responses, "strict");
    const [header, row] = report.split("\n");
    expect(header).toContain("cpf");
    expect(row).toBe("1,12345678900,1,1");
  });

  it("includes both student_name and cpf when present", () => {
    const key = buildKeyCSV(["q1"], [{ examNum: 1, answers: ["A"] }]);
    const responses = buildResponsesCSV(["exam_number", "student_name", "cpf", "q1"], [[1, "Alice", "12345", "A"]]);
    const report = gradeResponses(key, responses, "strict");
    const [header, row] = report.split("\n");
    expect(header).toBe("exam_number,student_name,cpf,q1,total_score");
    expect(row).toBe("1,Alice,12345,1,1");
  });

  it("report header uses the question IDs from the answer key", () => {
    const key = buildKeyCSV(["q1id", "q2id"], [{ examNum: 1, answers: ["A", "B"] }]);
    const responses = buildResponsesCSV(["exam_number", "q1id", "q2id"], [[1, "A", "B"]]);
    const header = gradeResponses(key, responses, "strict").split("\n")[0];
    expect(header).toBe("exam_number,q1id,q2id,total_score");
  });

  it("handles multiple student rows correctly", () => {
    const key = buildKeyCSV(["q1"], [
      { examNum: 1, answers: ["A"] },
      { examNum: 2, answers: ["B"] },
    ]);
    const responses = buildResponsesCSV(["exam_number", "q1"], [[1, "A"], [2, "A"]]);
    const report = gradeResponses(key, responses, "strict");
    const rows = report.split("\n");
    expect(rows).toHaveLength(3); // header + 2 rows
    expect(rows[1]).toBe("1,1,1");
    expect(rows[2]).toBe("2,0,0");
  });
});

// --- gradeResponses: lenient mode (letters) ---

describe("gradeResponses: lenient mode (letters)", () => {
  it("scores 1 when all alternatives correctly identified", () => {
    // 2 alternatives: Yes=correct(pos 0 → A), No=incorrect(pos 1 → B)
    // key="A", student="A": A→correct, B→correct = 2/2 = 1
    const q = makeQuestion();
    makeExam([q.id], "letters");
    const key = buildKeyCSV([q.id], [{ examNum: 1, answers: ["A"] }]);
    const responses = buildResponsesCSV(["exam_number", q.id], [[1, "A"]]);
    const report = gradeResponses(key, responses, "lenient");
    const score = report.split("\n")[1].split(",")[1];
    expect(Number(score)).toBe(1);
  });

  it("scores 0 when all alternatives wrongly identified", () => {
    // key="A", student="B": A→wrong, B→wrong = 0/2 = 0
    const q = makeQuestion();
    makeExam([q.id], "letters");
    const key = buildKeyCSV([q.id], [{ examNum: 1, answers: ["A"] }]);
    const responses = buildResponsesCSV(["exam_number", q.id], [[1, "B"]]);
    const report = gradeResponses(key, responses, "lenient");
    const score = report.split("\n")[1].split(",")[1];
    expect(Number(score)).toBe(0);
  });

  it("gives partial credit for partially correct answer", () => {
    // key="A", student="" (selected nothing): A→wrong, B→correct = 1/2 = 0.5
    const q = makeQuestion();
    makeExam([q.id], "letters");
    const key = buildKeyCSV([q.id], [{ examNum: 1, answers: ["A"] }]);
    const responses = buildResponsesCSV(["exam_number", q.id], [[1, ""]]);
    const report = gradeResponses(key, responses, "lenient");
    const score = report.split("\n")[1].split(",")[1];
    expect(Number(score)).toBe(0.5);
  });
});

// --- gradeResponses: lenient mode (powers) ---

describe("gradeResponses: lenient mode (powers)", () => {
  it("scores 1 for exact match", () => {
    // 2 alts: alt0=correct → power 1 → key="1"
    const q = makeQuestion();
    makeExam([q.id], "powers");
    const key = buildKeyCSV([q.id], [{ examNum: 1, answers: ["1"] }]);
    const responses = buildResponsesCSV(["exam_number", q.id], [[1, "1"]]);
    const report = gradeResponses(key, responses, "lenient");
    const score = report.split("\n")[1].split(",")[1];
    expect(Number(score)).toBe(1);
  });

  it("gives partial credit for partial powers answer", () => {
    // key="1" (only alt0 correct), student="0" (nothing selected)
    // bit0: key=1, student=0 → wrong; bit1: key=0, student=0 → correct → 1/2 = 0.5
    const q = makeQuestion();
    makeExam([q.id], "powers");
    const key = buildKeyCSV([q.id], [{ examNum: 1, answers: ["1"] }]);
    const responses = buildResponsesCSV(["exam_number", q.id], [[1, "0"]]);
    const report = gradeResponses(key, responses, "lenient");
    const score = report.split("\n")[1].split(",")[1];
    expect(Number(score)).toBe(0.5);
  });

  it("scores 0 when bits are all inverted", () => {
    // 2 alts: key="1" (alt0 correct), student="2" (alt1 selected)
    // bit0: key=1, student=0 → wrong; bit1: key=0, student=1 → wrong → 0/2 = 0
    const q = makeQuestion();
    makeExam([q.id], "powers");
    const key = buildKeyCSV([q.id], [{ examNum: 1, answers: ["1"] }]);
    const responses = buildResponsesCSV(["exam_number", q.id], [[1, "2"]]);
    const report = gradeResponses(key, responses, "lenient");
    const score = report.split("\n")[1].split(",")[1];
    expect(Number(score)).toBe(0);
  });
});

// --- gradeResponses: responses CSV with no data rows ---

describe("gradeResponses: empty responses", () => {
  it("returns only the header row when responses has no data", () => {
    const key = buildKeyCSV(["q1"], [{ examNum: 1, answers: ["A"] }]);
    const responses = "exam_number,q1";
    const report = gradeResponses(key, responses, "strict");
    const rows = report.split("\n");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toBe("exam_number,q1,total_score");
  });
});
