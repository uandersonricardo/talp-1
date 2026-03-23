import type { PaginatedResponse, Question } from "../types";
import { apiFetch } from "./client";

export function listQuestions(
  params: { search?: string; page?: number; limit?: number } = {},
): Promise<PaginatedResponse<Question>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.page != null) query.set("page", String(params.page));
  if (params.limit != null) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<PaginatedResponse<Question>>(`/api/questions${qs ? `?${qs}` : ""}`);
}

export function getQuestion(id: string): Promise<Question> {
  return apiFetch<Question>(`/api/questions/${id}`);
}

export function createQuestion(data: Omit<Question, "id">): Promise<Question> {
  return apiFetch<Question>("/api/questions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateQuestion(id: string, data: Omit<Question, "id">): Promise<Question> {
  return apiFetch<Question>(`/api/questions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteQuestion(id: string): Promise<void> {
  return apiFetch<void>(`/api/questions/${id}`, { method: "DELETE" });
}
