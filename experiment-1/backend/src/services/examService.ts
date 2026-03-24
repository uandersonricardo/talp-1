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
  if (!title?.trim()) throw new ServiceError(400, "Título é obrigatório");
  if (!course?.trim()) throw new ServiceError(400, "Disciplina é obrigatória");
  if (!professor?.trim()) throw new ServiceError(400, "Professor é obrigatório");
  if (!date?.trim()) throw new ServiceError(400, "Data é obrigatória");
  if (!["letters", "powers"].includes(identifierMode))
    throw new ServiceError(400, 'Modo de identificação deve ser "letras" ou "potências"');
  if (!Array.isArray(questionIds) || questionIds.length < 1)
    throw new ServiceError(400, "Pelo menos 1 questão é obrigatória");
  for (const qId of questionIds) {
    if (!questions.find((q) => q.id === qId)) throw new ServiceError(400, `Questão não encontrada: ${qId}`);
  }
}

export function listExams(search: string | undefined, page = 1, limit = DEFAULT_LIMIT) {
  const filtered = search
    ? exams.filter(
        (e) =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.course.toLowerCase().includes(search.toLowerCase()) ||
          e.professor.toLowerCase().includes(search.toLowerCase()),
      )
    : exams;
  const total = filtered.length;
  const data = filtered.slice((page - 1) * limit, page * limit);
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
  if (!exam) throw new ServiceError(404, "Prova não encontrada");
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
  if (idx === -1) throw new ServiceError(404, "Prova não encontrada");
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
  if (idx === -1) throw new ServiceError(404, "Prova não encontrada");
  if (generationBatches.some((b) => b.examId === id))
    throw new ServiceError(409, "A prova possui lotes gerados e não pode ser excluída");
  exams.splice(idx, 1);
}
