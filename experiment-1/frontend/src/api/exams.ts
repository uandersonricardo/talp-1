import type { Exam, PaginatedResponse } from "../types";
import { apiFetch } from "./client";

export function listExams(params: { page?: number; limit?: number; search?: string } = {}): Promise<PaginatedResponse<Exam>> {
  const query = new URLSearchParams();
  if (params.page != null) query.set("page", String(params.page));
  if (params.limit != null) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  const qs = query.toString();
  return apiFetch<PaginatedResponse<Exam>>(`/api/exams${qs ? `?${qs}` : ""}`);
}

export function getExam(id: string): Promise<Exam> {
  return apiFetch<Exam>(`/api/exams/${id}`);
}

export function createExam(data: Omit<Exam, "id">): Promise<Exam> {
  return apiFetch<Exam>("/api/exams", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateExam(id: string, data: Omit<Exam, "id">): Promise<Exam> {
  return apiFetch<Exam>(`/api/exams/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteExam(id: string): Promise<void> {
  return apiFetch<void>(`/api/exams/${id}`, { method: "DELETE" });
}
