import { beforeEach, describe, expect, it } from "vitest";

import { exams, questions, resetDb } from "../../src/db";
import {
  ServiceError,
  createQuestion,
  deleteQuestion,
  getQuestion,
  listQuestions,
  updateQuestion,
} from "../../src/services/questionService";

const validAlts = [
  { description: "Yes", correct: true },
  { description: "No", correct: false },
];

describe("questionService", () => {
  beforeEach(() => resetDb());

  // --- createQuestion ---

  describe("createQuestion", () => {
    it("creates a question and persists it", () => {
      const q = createQuestion("Is this a test?", validAlts);
      expect(q.id).toBeDefined();
      expect(q.statement).toBe("Is this a test?");
      expect(q.alternatives).toEqual(validAlts);
      expect(questions).toHaveLength(1);
    });

    it("assigns a unique UUID each time", () => {
      const a = createQuestion("Q1", validAlts);
      const b = createQuestion("Q2", validAlts);
      expect(a.id).not.toBe(b.id);
    });

    it("throws 400 when statement is empty", () => {
      expect(() => createQuestion("", validAlts)).toThrow(ServiceError);
      expect(() => createQuestion("  ", validAlts)).toThrow(ServiceError);
      try {
        createQuestion("", validAlts);
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(400);
      }
    });

    it("throws 400 when fewer than 2 alternatives", () => {
      expect(() => createQuestion("Q?", [{ description: "Only", correct: true }])).toThrow(ServiceError);
      try {
        createQuestion("Q?", [{ description: "Only", correct: true }]);
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(400);
      }
    });

    it("throws 400 when no alternative is correct", () => {
      const alts = [
        { description: "A", correct: false },
        { description: "B", correct: false },
      ];
      try {
        createQuestion("Q?", alts);
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(400);
        expect((e as ServiceError).message).toMatch(/correct/);
      }
    });
  });

  // --- listQuestions ---

  describe("listQuestions", () => {
    beforeEach(() => {
      createQuestion("What is the capital of France?", validAlts);
      createQuestion("What is 2 + 2?", validAlts);
      createQuestion("Who wrote Hamlet?", validAlts);
    });

    it("returns all questions with pagination metadata", () => {
      const result = listQuestions();
      expect(result.total).toBe(3);
      expect(result.data).toHaveLength(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("filters by search term (case-insensitive)", () => {
      const result = listQuestions("hamlet");
      expect(result.total).toBe(1);
      expect(result.data[0].statement).toMatch(/Hamlet/);
    });

    it("returns empty data when search matches nothing", () => {
      const result = listQuestions("zzznomatch");
      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it("paginates correctly", () => {
      const page1 = listQuestions(undefined, 1, 2);
      expect(page1.data).toHaveLength(2);
      expect(page1.total).toBe(3);

      const page2 = listQuestions(undefined, 2, 2);
      expect(page2.data).toHaveLength(1);
    });
  });

  // --- getQuestion ---

  describe("getQuestion", () => {
    it("returns the question by id", () => {
      const created = createQuestion("Q?", validAlts);
      expect(getQuestion(created.id)).toEqual(created);
    });

    it("throws 404 for unknown id", () => {
      try {
        getQuestion("non-existent-id");
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(404);
      }
    });
  });

  // --- updateQuestion ---

  describe("updateQuestion", () => {
    it("updates statement and alternatives", () => {
      const q = createQuestion("Old statement", validAlts);
      const newAlts = [
        { description: "True", correct: true },
        { description: "False", correct: false },
      ];
      const updated = updateQuestion(q.id, "New statement", newAlts);
      expect(updated.id).toBe(q.id);
      expect(updated.statement).toBe("New statement");
      expect(updated.alternatives).toEqual(newAlts);
    });

    it("persists the update in the store", () => {
      const q = createQuestion("Old", validAlts);
      updateQuestion(q.id, "Updated", validAlts);
      expect(getQuestion(q.id).statement).toBe("Updated");
    });

    it("throws 404 for unknown id", () => {
      try {
        updateQuestion("bad-id", "Q?", validAlts);
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(404);
      }
    });

    it("throws 400 on invalid body", () => {
      const q = createQuestion("Q?", validAlts);
      try {
        updateQuestion(q.id, "", validAlts);
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(400);
      }
    });
  });

  // --- deleteQuestion ---

  describe("deleteQuestion", () => {
    it("removes the question from the store", () => {
      const q = createQuestion("Delete me", validAlts);
      expect(questions).toHaveLength(1);
      deleteQuestion(q.id);
      expect(questions).toHaveLength(0);
    });

    it("throws 404 for unknown id", () => {
      try {
        deleteQuestion("no-such-id");
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(404);
      }
    });

    it("throws 409 when the question is used in an exam", () => {
      const q = createQuestion("Q?", validAlts);
      exams.push({
        id: "exam-1",
        title: "Exam",
        course: "Math",
        professor: "Dr. X",
        date: "2026-04-01",
        identifierMode: "letters",
        questions: [q.id],
      });
      try {
        deleteQuestion(q.id);
      } catch (e) {
        expect((e as ServiceError).statusCode).toBe(409);
      }
    });
  });
});
