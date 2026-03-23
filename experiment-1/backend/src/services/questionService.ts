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
    throw new ServiceError(400, "Enunciado é obrigatório");
  }
  if (!Array.isArray(alternatives) || alternatives.length < 2) {
    throw new ServiceError(400, "São necessárias pelo menos 2 alternativas");
  }
  if (!alternatives.some((a) => a.correct)) {
    throw new ServiceError(400, "Pelo menos uma alternativa deve ser correta");
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
  if (!q) throw new ServiceError(404, "Questão não encontrada");
  return q;
}

export function updateQuestion(id: string, statement: string, alternatives: Alternative[]): Question {
  validate(statement, alternatives);
  const idx = questions.findIndex((q) => q.id === id);
  if (idx === -1) throw new ServiceError(404, "Questão não encontrada");
  questions[idx] = { id, statement, alternatives };
  return questions[idx];
}

export function deleteQuestion(id: string): void {
  const idx = questions.findIndex((q) => q.id === id);
  if (idx === -1) throw new ServiceError(404, "Questão não encontrada");

  const usedInExam = exams.some((e) => e.questions.includes(id));
  if (usedInExam) throw new ServiceError(409, "Questão está sendo usada em uma prova");

  questions.splice(idx, 1);
}
