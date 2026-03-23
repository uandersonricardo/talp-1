import type { GenerationBatch } from "../types";
import { apiFetch, buildUrl } from "./client";

export interface GenerationResult {
  batchId: string;
  count: number;
  generatedAt: string;
  pdfUrl: string;
  answersUrl: string;
}

export function generateBatch(examId: string, count: number): Promise<GenerationResult> {
  return apiFetch<GenerationResult>(`/api/exams/${examId}/generate`, {
    method: "POST",
    body: JSON.stringify({ count }),
  });
}

export function getExamBatches(examId: string): Promise<GenerationBatch[]> {
  return apiFetch<GenerationBatch[]>(`/api/exams/${examId}/batches`);
}

export function getBatchPdfUrl(batchId: string): string {
  return buildUrl(`/api/batches/${batchId}/pdf`);
}

export function getBatchAnswersUrl(batchId: string): string {
  return buildUrl(`/api/batches/${batchId}/answers.csv`);
}
