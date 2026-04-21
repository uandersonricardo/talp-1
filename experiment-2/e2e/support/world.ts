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

interface ClassRecord {
  id: string;
  description: string;
  year: number;
  semester: 1 | 2;
  studentIds: string[];
}

interface GoalRecord {
  id: string;
  name: string;
}

export class World extends CucumberWorld {
  context!: BrowserContext;
  page!: Page;

  private studentCounter = 0;

  constructor(options: IWorldOptions) {
    super(options);
  }

  // ─── Generic helpers ───────────────────────────────────────────────────────

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

  async reloadPage(): Promise<void> {
    await this.page.reload({ waitUntil: "networkidle" });
  }

  // ─── Student helpers ───────────────────────────────────────────────────────

  async cleanStudents(): Promise<void> {
    const students = await this.apiGet<StudentRecord[]>("/api/students");
    await Promise.all(
      students.map((s) =>
        fetch(`${BACKEND_URL}/api/students/${s.id}`, { method: "DELETE" }),
      ),
    );
  }

  async createStudent(name: string, cpf: string, email: string): Promise<StudentRecord> {
    return this.apiPost<StudentRecord>("/api/students", { name, cpf, email });
  }

  /** Creates a student with a unique auto-generated CPF and email (for class scenarios). */
  async createStudentAuto(name: string): Promise<StudentRecord> {
    this.studentCounter++;
    const n = this.studentCounter;
    const base = String(n + 100_000_000); // always 9 digits
    const cpf = `${base.slice(0, 3)}.${base.slice(3, 6)}.${base.slice(6, 9)}-${String(n + 10).slice(-2)}`;
    const email = `student${n}@example.com`;
    return this.createStudent(name, cpf, email);
  }

  async getStudentByName(name: string): Promise<StudentRecord | undefined> {
    const students = await this.apiGet<StudentRecord[]>("/api/students");
    return students.find((s) => s.name === name);
  }

  // ─── Class helpers ─────────────────────────────────────────────────────────

  async cleanClasses(): Promise<void> {
    const classes = await this.apiGet<ClassRecord[]>("/api/classes");
    await Promise.all(
      classes.map((c) =>
        fetch(`${BACKEND_URL}/api/classes/${c.id}`, { method: "DELETE" }),
      ),
    );
  }

  async createClass(description: string, year: number, semester: 1 | 2): Promise<ClassRecord> {
    return this.apiPost<ClassRecord>("/api/classes", { description, year, semester });
  }

  async getClassByDescription(description: string): Promise<ClassRecord | undefined> {
    const classes = await this.apiGet<ClassRecord[]>("/api/classes");
    return classes.find((c) => c.description === description);
  }

  async enrollStudentInClass(classId: string, studentId: string): Promise<void> {
    await fetch(`${BACKEND_URL}/api/classes/${classId}/students/${studentId}`, {
      method: "POST",
    });
  }

  // ─── Goal helpers ──────────────────────────────────────────────────────────

  async cleanGoals(): Promise<void> {
    const goals = await this.apiGet<GoalRecord[]>("/api/goals");
    await Promise.all(
      goals.map((g) =>
        fetch(`${BACKEND_URL}/api/goals/${g.id}`, { method: "DELETE" }),
      ),
    );
  }

  async createGoal(name: string): Promise<GoalRecord> {
    return this.apiPost<GoalRecord>("/api/goals", { name });
  }
}

setWorldConstructor(World);
