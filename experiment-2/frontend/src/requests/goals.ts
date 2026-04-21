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
