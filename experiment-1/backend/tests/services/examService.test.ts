import { beforeEach, describe, expect, it } from "vitest";

import { exams, generationBatches, resetDb } from "../../src/db";
import { type ServiceError, createQuestion } from "../../src/services/questionService";
import { createExam, deleteExam, getExam, listExams, updateExam } from "../../src/services/examService";

const validAlts = [
  { description: "Yes", correct: true },
  { description: "No", correct: false },
];

function makeQuestion() {
  return createQuestion("Sample question?", validAlts);
}

function makeExam(questionIds: string[]) {
  return createExam("Midterm", "Math 101", "Dr. Smith", "2026-04-15", "letters", questionIds);
}

describe("examService", () => {
  beforeEach(() => resetDb());

  // --- createExam ---

  describe("createExam", () => {
    it("creates an exam and persists it", () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      expect(exam.id).toBeDefined();
      expect(exam.title).toBe("Midterm");
      expect(exam.questions).toEqual([q.id]);
      expect(exams).toHaveLength(1);
    });

    it("assigns a unique UUID each time", () => {
      const q = makeQuestion();
      const a = makeExam([q.id]);
      const b = makeExam([q.id]);
      expect(a.id).not.toBe(b.id);
    });

    it("throws 400 when title is missing", () => {
      const q = makeQuestion();
      try {
        createExam("", "Math", "Dr. X", "2026-04-15", "letters", [q.id]);
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(400);
        expect((e as ServiceError).message).toMatch(/título/i);
      }
    });

    it("throws 400 when course is missing", () => {
      const q = makeQuestion();
      try {
        createExam("Midterm", "", "Dr. X", "2026-04-15", "letters", [q.id]);
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(400);
        expect((e as ServiceError).message).toMatch(/disciplina/i);
      }
    });

    it("throws 400 when professor is missing", () => {
      const q = makeQuestion();
      try {
        createExam("Midterm", "Math", "", "2026-04-15", "letters", [q.id]);
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(400);
        expect((e as ServiceError).message).toMatch(/professor/i);
      }
    });

    it("throws 400 when date is missing", () => {
      const q = makeQuestion();
      try {
        createExam("Midterm", "Math", "Dr. X", "", "letters", [q.id]);
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(400);
        expect((e as ServiceError).message).toMatch(/data/i);
      }
    });

    it("throws 400 for invalid identifierMode", () => {
      const q = makeQuestion();
      try {
        createExam("Midterm", "Math", "Dr. X", "2026-04-15", "invalid", [q.id]);
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(400);
        expect((e as ServiceError).message).toMatch(/identifica/i);
      }
    });

    it("throws 400 when questions array is empty", () => {
      try {
        createExam("Midterm", "Math", "Dr. X", "2026-04-15", "letters", []);
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(400);
        expect((e as ServiceError).message).toMatch(/quest/i);
      }
    });

    it("throws 400 when a question ID does not exist", () => {
      try {
        createExam("Midterm", "Math", "Dr. X", "2026-04-15", "letters", ["non-existent-id"]);
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(400);
        expect((e as ServiceError).message).toMatch(/não encontrada/i);
      }
    });

    it("accepts powers identifierMode", () => {
      const q = makeQuestion();
      const exam = createExam("Final", "Physics", "Prof. Y", "2026-05-01", "powers", [q.id]);
      expect(exam.identifierMode).toBe("powers");
    });
  });

  // --- listExams ---

  describe("listExams", () => {
    beforeEach(() => {
      const q = makeQuestion();
      makeExam([q.id]);
      makeExam([q.id]);
      makeExam([q.id]);
    });

    it("returns all exams with pagination metadata", () => {
      const result = listExams();
      expect(result.total).toBe(3);
      expect(result.data).toHaveLength(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("paginates correctly", () => {
      const page1 = listExams(undefined, 1, 2);
      expect(page1.data).toHaveLength(2);
      expect(page1.total).toBe(3);

      const page2 = listExams(undefined, 2, 2);
      expect(page2.data).toHaveLength(1);
    });

    it("returns empty data when no exams exist", () => {
      resetDb();
      const result = listExams();
      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });
  });

  // --- getExam ---

  describe("getExam", () => {
    it("returns the exam by id", () => {
      const q = makeQuestion();
      const created = makeExam([q.id]);
      expect(getExam(created.id)).toEqual(created);
    });

    it("throws 404 for unknown id", () => {
      try {
        getExam("non-existent-id");
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(404);
      }
    });
  });

  // --- updateExam ---

  describe("updateExam", () => {
    it("updates exam fields and persists", () => {
      const q = makeQuestion();
      const q2 = makeQuestion();
      const exam = makeExam([q.id]);
      const updated = updateExam(exam.id, "Final", "Physics", "Prof. Y", "2026-05-01", "powers", [q2.id]);
      expect(updated.id).toBe(exam.id);
      expect(updated.title).toBe("Final");
      expect(updated.identifierMode).toBe("powers");
      expect(updated.questions).toEqual([q2.id]);
    });

    it("persists the update in the store", () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      updateExam(exam.id, "Updated Title", "Course", "Prof", "2026-01-01", "letters", [q.id]);
      expect(getExam(exam.id).title).toBe("Updated Title");
    });

    it("throws 404 for unknown id", () => {
      const q = makeQuestion();
      try {
        updateExam("bad-id", "T", "C", "P", "2026-01-01", "letters", [q.id]);
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(404);
      }
    });

    it("throws 400 on invalid body", () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      try {
        updateExam(exam.id, "", "Course", "Prof", "2026-01-01", "letters", [q.id]);
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(400);
      }
    });
  });

  // --- deleteExam ---

  describe("deleteExam", () => {
    it("removes the exam from the store", () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      expect(exams).toHaveLength(1);
      deleteExam(exam.id);
      expect(exams).toHaveLength(0);
    });

    it("throws 404 for unknown id", () => {
      try {
        deleteExam("no-such-id");
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(404);
      }
    });

    it("throws 409 when exam has generated batches", () => {
      const q = makeQuestion();
      const exam = makeExam([q.id]);
      generationBatches.push({
        id: "batch-1",
        examId: exam.id,
        count: 10,
        generatedAt: "2026-04-01T10:00:00Z",
        sequenceNumberStart: 1,
      });
      try {
        deleteExam(exam.id);
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(409);
      }
    });
  });
});
