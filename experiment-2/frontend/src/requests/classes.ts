import type { Class, Evaluation, Grade } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type ApiResponse<T> = { data: T };

async function handleResponse<T>(res: Response): Promise<T> {
  const json: unknown = await res.json();
  if (!res.ok) {
    const message =
      typeof json === "object" && json !== null && "error" in json
        ? String((json as { error: unknown }).error)
        : "Erro inesperado";
    throw new Error(message);
  }
  return (json as ApiResponse<T>).data;
}

export async function listClasses(): Promise<Class[]> {
  const res = await fetch(`${BASE_URL}/api/classes`);
  return handleResponse<Class[]>(res);
}

export async function createClass(data: Omit<Class, "id" | "studentIds">): Promise<Class> {
  const res = await fetch(`${BASE_URL}/api/classes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Class>(res);
}

export async function updateClass(id: string, data: Omit<Class, "id" | "studentIds">): Promise<Class> {
  const res = await fetch(`${BASE_URL}/api/classes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Class>(res);
}

export async function deleteClass(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/classes/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json: unknown = await res.json();
    const message =
      typeof json === "object" && json !== null && "error" in json
        ? String((json as { error: unknown }).error)
        : "Erro inesperado";
    throw new Error(message);
  }
}

export async function enrollStudent(classId: string, studentId: string): Promise<Class> {
  const res = await fetch(`${BASE_URL}/api/classes/${classId}/students/${studentId}`, {
    method: "POST",
  });
  return handleResponse<Class>(res);
}

export async function unenrollStudent(classId: string, studentId: string): Promise<Class> {
  const res = await fetch(`${BASE_URL}/api/classes/${classId}/students/${studentId}`, {
    method: "DELETE",
  });
  return handleResponse<Class>(res);
}

export async function listEvaluations(classId: string): Promise<Evaluation[]> {
  const res = await fetch(`${BASE_URL}/api/classes/${classId}/evaluations`);
  return handleResponse<Evaluation[]>(res);
}

export async function upsertEvaluation(
  classId: string,
  data: { studentId: string; goalId: string; grade: Grade },
): Promise<Evaluation> {
  const res = await fetch(`${BASE_URL}/api/classes/${classId}/evaluations`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Evaluation>(res);
}
