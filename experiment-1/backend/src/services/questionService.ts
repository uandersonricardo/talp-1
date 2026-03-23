import { randomUUID } from "crypto";
import { exams, questions } from "../db";
import type { Alternative, Question } from "../types";

const DEFAULT_LIMIT = 20;

export class ServiceError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

function validate(statement: string, alternatives: Alternative[]): void {
  if (!statement?.trim()) {
    throw new ServiceError(400, "statement is required");
  }
  if (!Array.isArray(alternatives) || alternatives.length < 2) {
    throw new ServiceError(400, "at least 2 alternatives are required");
  }
  if (!alternatives.some((a) => a.correct)) {
    throw new ServiceError(400, "at least one alternative must be correct");
  }
}

export function listQuestions(search?: string, page = 1, limit = DEFAULT_LIMIT) {
  const filtered = search
    ? questions.filter((q) => q.statement.toLowerCase().includes(search.toLowerCase()))
    : [...questions];

  const total = filtered.length;
  const data = filtered.slice((page - 1) * limit, page * limit);

  return { data, page, limit, total };
}

export function createQuestion(statement: string, alternatives: Alternative[]): Question {
  validate(statement, alternatives);
  const question: Question = { id: randomUUID(), statement, alternatives };
  questions.push(question);
  return question;
}

export function getQuestion(id: string): Question {
  const q = questions.find((q) => q.id === id);
  if (!q) throw new ServiceError(404, "question not found");
  return q;
}

export function updateQuestion(id: string, statement: string, alternatives: Alternative[]): Question {
  validate(statement, alternatives);
  const idx = questions.findIndex((q) => q.id === id);
  if (idx === -1) throw new ServiceError(404, "question not found");
  questions[idx] = { id, statement, alternatives };
  return questions[idx];
}

export function deleteQuestion(id: string): void {
  const idx = questions.findIndex((q) => q.id === id);
  if (idx === -1) throw new ServiceError(404, "question not found");

  const usedInExam = exams.some((e) => e.questions.includes(id));
  if (usedInExam) throw new ServiceError(409, "question is referenced by an exam");

  questions.splice(idx, 1);
}
