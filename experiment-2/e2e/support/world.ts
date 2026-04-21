import { World as CucumberWorld, setWorldConstructor } from "@cucumber/cucumber";
import type { IWorldOptions } from "@cucumber/cucumber";
import type { BrowserContext, Page } from "playwright";
import { BACKEND_URL, FRONTEND_URL } from "./server";

export { FRONTEND_URL };

interface StudentRecord {
  id: string;
  name: string;
  cpf: string;
  email: string;
}

export class World extends CucumberWorld {
  context!: BrowserContext;
  page!: Page;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${BACKEND_URL}${path}`);
    const json = (await res.json()) as { data: T };
    return json.data;
  }

  async apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { data: T };
    return json.data;
  }

  async cleanStudents(): Promise<void> {
    const students = await this.apiGet<StudentRecord[]>("/api/students");
    await Promise.all(
      students.map((s) =>
        fetch(`${BACKEND_URL}/api/students/${s.id}`, { method: "DELETE" }),
      ),
    );
  }

  async createStudent(name: string, cpf: string, email: string): Promise<void> {
    await this.apiPost<StudentRecord>("/api/students", { name, cpf, email });
  }

  async reloadPage(): Promise<void> {
    await this.page.reload({ waitUntil: "networkidle" });
  }
}

setWorldConstructor(World);
