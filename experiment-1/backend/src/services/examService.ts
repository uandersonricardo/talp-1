import { randomUUID } from "node:crypto";

import { exams, generationBatches, questions } from "../db";
import type { Exam } from "../types";
import { ServiceError } from "./questionService";

const DEFAULT_LIMIT = 20;

function validate(
  title: string,
  course: string,
  professor: string,
  date: string,
  identifierMode: string,
  questionIds: string[],
): void {
  if (!title?.trim()) throw new ServiceError(400, "title is required");
  if (!course?.trim()) throw new ServiceError(400, "course is required");
  if (!professor?.trim()) throw new ServiceError(400, "professor is required");
  if (!date?.trim()) throw new ServiceError(400, "date is required");
  if (!["letters", "powers"].includes(identifierMode))
    throw new ServiceError(400, 'identifierMode must be "letters" or "powers"');
  if (!Array.isArray(questionIds) || questionIds.length < 1)
    throw new ServiceError(400, "at least 1 question is required");
  for (const qId of questionIds) {
    if (!questions.find((q) => q.id === qId)) throw new ServiceError(400, `question not found: ${qId}`);
  }
}

export function listExams(page = 1, limit = DEFAULT_LIMIT) {
  const total = exams.length;
  const data = exams.slice((page - 1) * limit, page * limit);
  return { data, page, limit, total };
}

export function createExam(
  title: string,
  course: string,
  professor: string,
  date: string,
  identifierMode: string,
  questionIds: string[],
): Exam {
  validate(title, course, professor, date, identifierMode, questionIds);
  const exam: Exam = {
    id: randomUUID(),
    title,
    course,
    professor,
    date,
    identifierMode: identifierMode as "letters" | "powers",
    questions: questionIds,
  };
  exams.push(exam);
  return exam;
}

export function getExam(id: string): Exam {
  const exam = exams.find((e) => e.id === id);
  if (!exam) throw new ServiceError(404, "exam not found");
  return exam;
}

export function updateExam(
  id: string,
  title: string,
  course: string,
  professor: string,
  date: string,
  identifierMode: string,
  questionIds: string[],
): Exam {
  validate(title, course, professor, date, identifierMode, questionIds);
  const idx = exams.findIndex((e) => e.id === id);
  if (idx === -1) throw new ServiceError(404, "exam not found");
  exams[idx] = {
    id,
    title,
    course,
    professor,
    date,
    identifierMode: identifierMode as "letters" | "powers",
    questions: questionIds,
  };
  return exams[idx];
}

export function deleteExam(id: string): void {
  const idx = exams.findIndex((e) => e.id === id);
  if (idx === -1) throw new ServiceError(404, "exam not found");
  if (generationBatches.some((b) => b.examId === id))
    throw new ServiceError(409, "exam has generated batches and cannot be deleted");
  exams.splice(idx, 1);
}
