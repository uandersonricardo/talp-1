import type { Exam, GenerationBatch, IndividualExam, Question } from "./types";

export const questions: Question[] = [];
export const exams: Exam[] = [];
export const generationBatches: GenerationBatch[] = [];
export const individualExams: IndividualExam[] = [];
export const batchPdfs = new Map<string, Buffer>();
export const batchCsvs = new Map<string, string>();

export function resetDb(): void {
  questions.length = 0;
  exams.length = 0;
  generationBatches.length = 0;
  individualExams.length = 0;
  batchPdfs.clear();
  batchCsvs.clear();
}
