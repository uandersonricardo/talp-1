import type { Exam, GenerationBatch, Question } from "./types";

export const questions: Question[] = [];
export const exams: Exam[] = [];
export const generationBatches: GenerationBatch[] = [];

export function resetDb(): void {
  questions.length = 0;
  exams.length = 0;
  generationBatches.length = 0;
}
