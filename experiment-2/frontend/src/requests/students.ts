import type { Student } from "../types";

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

export async function listStudents(): Promise<Student[]> {
  const res = await fetch(`${BASE_URL}/api/students`);
  return handleResponse<Student[]>(res);
}

export async function createStudent(data: Omit<Student, "id">): Promise<Student> {
  const res = await fetch(`${BASE_URL}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Student>(res);
}

export async function updateStudent(id: string, data: Omit<Student, "id">): Promise<Student> {
  const res = await fetch(`${BASE_URL}/api/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Student>(res);
}

export async function deleteStudent(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/students/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json: unknown = await res.json();
    const message =
      typeof json === "object" && json !== null && "error" in json
        ? String((json as { error: unknown }).error)
        : "Erro inesperado";
    throw new Error(message);
  }
}
