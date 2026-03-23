import { beforeEach, describe, expect, it } from "vitest";

import { batchCsvs, batchPdfs, generationBatches, resetDb } from "../../src/db";
import { createExam } from "../../src/services/examService";
import {
  generateBatch,
  getExamBatches,
  getBatchAnswersCsv,
  getBatchPdf,
} from "../../src/services/generationService";
import { ServiceError, createQuestion } from "../../src/services/questionService";

const validAlts = [
  { description: "Yes", correct: true },
  { description: "No", correct: false },
];

function makeQuestion() {
  return createQuestion("Sample?", validAlts);
}

function makeExam(questionIds: string[], mode: "letters" | "powers" = "letters") {
  return createExam("Midterm", "Math", "Dr. X", "2026-04-15", mode, questionIds);
}

describe("generationService", () => {
  beforeEach(() => resetDb());

  // --- generateBatch ---

  describe("generateBatch", () => {
    it("creates a batch with correct properties", async () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      const result = await generateBatch(exam.id, 3);

      expect(result.batch.id).toBeDefined();
      expect(result.batch.examId).toBe(exam.id);
      expect(result.batch.count).toBe(3);
      expect(result.batch.generatedAt).toBeDefined();
      expect(result.batch.sequenceNumberStart).toBe(1);
    });

    it("persists the batch in db", async () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      await generateBatch(exam.id, 2);
      expect(generationBatches).toHaveLength(1);
      expect(generationBatches[0].count).toBe(2);
    });

    it("returns pdfUrl and answersUrl pointing to the batch", async () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      const result = await generateBatch(exam.id, 1);
      expect(result.pdfUrl).toBe(`/api/batches/${result.batch.id}/pdf`);
      expect(result.answersUrl).toBe(`/api/batches/${result.batch.id}/answers.csv`);
    });

    it("assigns increasing sequence numbers across successive batches", async () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      const r1 = await generateBatch(exam.id, 3);
      const r2 = await generateBatch(exam.id, 2);
      expect(r1.batch.sequenceNumberStart).toBe(1);
      expect(r2.batch.sequenceNumberStart).toBe(4); // 1 + 3
    });

    it("stores a non-empty PDF buffer", async () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      const result = await generateBatch(exam.id, 1);
      const pdf = batchPdfs.get(result.batch.id);
      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf!.length).toBeGreaterThan(0);
    });

    it("stores a CSV string containing the header", async () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      const result = await generateBatch(exam.id, 2);
      const csv = batchCsvs.get(result.batch.id);
      expect(typeof csv).toBe("string");
      expect(csv).toContain("exam_number");
    });

    it("throws 400 for count = 0", async () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      await expect(generateBatch(exam.id, 0)).rejects.toMatchObject({ statusCode: 400 });
    });

    it("throws 400 for non-integer count", async () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      await expect(generateBatch(exam.id, 1.5)).rejects.toMatchObject({ statusCode: 400 });
    });

    it("throws 400 for negative count", async () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      await expect(generateBatch(exam.id, -1)).rejects.toMatchObject({ statusCode: 400 });
    });

    it("throws 404 for unknown exam", async () => {
      await expect(generateBatch("non-existent", 1)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // --- getExamBatches ---

  describe("getExamBatches", () => {
    it("returns empty array when no batches exist", () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      expect(getExamBatches(exam.id)).toEqual([]);
    });

    it("returns all batches for the exam", async () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      await generateBatch(exam.id, 2);
      await generateBatch(exam.id, 3);
      const batches = getExamBatches(exam.id);
      expect(batches).toHaveLength(2);
      expect(batches.every((b) => b.examId === exam.id)).toBe(true);
    });

    it("only returns batches for the given exam, not others", async () => {
      const q = makeQuestion();
      const exam1 = makeExam([q.id]);
      const exam2 = makeExam([q.id]);
      await generateBatch(exam1.id, 1);
      await generateBatch(exam2.id, 1);
      expect(getExamBatches(exam1.id)).toHaveLength(1);
      expect(getExamBatches(exam2.id)).toHaveLength(1);
    });

    it("throws 404 for unknown exam", () => {
      try {
        getExamBatches("no-such-id");
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(404);
      }
    });
  });

  // --- getBatchPdf ---

  describe("getBatchPdf", () => {
    it("returns a non-empty Buffer for a known batch", async () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      const result = await generateBatch(exam.id, 1);
      const pdf = getBatchPdf(result.batch.id);
      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it("throws 404 for unknown batchId", () => {
      try {
        getBatchPdf("no-such-batch");
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(404);
      }
    });
  });

  // --- getBatchAnswersCsv ---

  describe("getBatchAnswersCsv", () => {
    it("returns CSV with exam_number header and question IDs in canonical order", async () => {
      const q = makeQuestion();
      const exam = makeExam([q.id], "letters");
      const result = await generateBatch(exam.id, 2);
      const csv = getBatchAnswersCsv(result.batch.id);
      const lines = csv.split("\n");
      expect(lines[0]).toBe(`exam_number,${q.id}`);
      expect(lines).toHaveLength(3); // header + 2 rows
    });

    it("CSV rows have sequential exam numbers starting at sequenceNumberStart", async () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      const result = await generateBatch(exam.id, 3);
      const csv = getBatchAnswersCsv(result.batch.id);
      const rows = csv.split("\n").slice(1);
      expect(rows.map((r) => r.split(",")[0])).toEqual(["1", "2", "3"]);
    });

    it("letters mode answer is a non-empty string of uppercase letters", async () => {
      const q = makeQuestion(); // 1 correct alternative
      const exam = makeExam([q.id], "letters");
      const result = await generateBatch(exam.id, 1);
      const csv = getBatchAnswersCsv(result.batch.id);
      const answerCell = csv.split("\n")[1].split(",")[1];
      expect(answerCell).toMatch(/^[A-Z]+$/);
    });

    it("powers mode answer is a positive integer", async () => {
      const q = makeQuestion(); // 1 correct alternative
      const exam = makeExam([q.id], "powers");
      const result = await generateBatch(exam.id, 1);
      const csv = getBatchAnswersCsv(result.batch.id);
      const answerCell = csv.split("\n")[1].split(",")[1];
      const val = parseInt(answerCell, 10);
      expect(Number.isInteger(val) && val > 0).toBe(true);
    });

    it("second batch CSV rows continue sequence numbering", async () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      await generateBatch(exam.id, 3);
      const r2 = await generateBatch(exam.id, 2);
      const csv = getBatchAnswersCsv(r2.batch.id);
      const rows = csv.split("\n").slice(1);
      expect(rows.map((r) => r.split(",")[0])).toEqual(["4", "5"]);
    });

    it("throws 404 for unknown batchId", () => {
      try {
        getBatchAnswersCsv("no-such-batch");
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(404);
      }
    });
  });
});
