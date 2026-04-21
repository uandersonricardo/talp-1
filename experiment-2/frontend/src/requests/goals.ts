import type { Goal } from "../types";

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

export async function listGoals(): Promise<Goal[]> {
  const res = await fetch(`${BASE_URL}/api/goals`);
  return handleResponse<Goal[]>(res);
}

export async function createGoal(data: Omit<Goal, "id">): Promise<Goal> {
  const res = await fetch(`${BASE_URL}/api/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Goal>(res);
}

export async function deleteGoal(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/goals/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json: unknown = await res.json();
    const message =
      typeof json === "object" && json !== null && "error" in json
        ? String((json as { error: unknown }).error)
        : "Erro inesperado";
    throw new Error(message);
  }
}
