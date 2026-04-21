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

interface EmailQueueEntry {
  studentId: string;
  date: string;
  updates: Array<{ classId: string; goalId: string; grade: string }>;
  sent: boolean;
}

export interface SentEmail {
  to: string;
  subject: string;
  text: string;
}

export class World extends CucumberWorld {
  context!: BrowserContext;
  page!: Page;

  // Tracks the most recently set-up evaluation so contextual steps
  // ("the instructor updates the grade to X") know which record to update.
  lastEvalContext: { studentId: string; goalId: string; classId: string } | null = null;

  // Each call to runDigest() advances this offset by 1 so sequential digest
  // invocations in the same scenario process successively later dates.
  private digestOffset = 0;

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

  async navigateTo(pageName: string): Promise<void> {
    const paths: Record<string, string> = {
      Alunos: "/alunos",
      Turmas: "/turmas",
      Metas: "/metas",
    };
    const path = paths[pageName];
    if (!path) throw new Error(`Unknown page name: "${pageName}"`);
    await this.page.goto(path, { waitUntil: "networkidle" });
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
  async createStudentAuto(name: string, emailOverride?: string): Promise<StudentRecord> {
    this.studentCounter++;
    const n = this.studentCounter;
    const base = String(n + 100_000_000); // always 9 digits
    const cpf = `${base.slice(0, 3)}.${base.slice(3, 6)}.${base.slice(6, 9)}-${String(n + 10).slice(-2)}`;
    const email = emailOverride ?? `student${n}@example.com`;
    return this.createStudent(name, cpf, email);
  }

  async getStudentByName(name: string): Promise<StudentRecord | undefined> {
    const students = await this.apiGet<StudentRecord[]>("/api/students");
    return students.find((s) => s.name === name);
  }

  async getStudentByEmail(email: string): Promise<StudentRecord | undefined> {
    const students = await this.apiGet<StudentRecord[]>("/api/students");
    return students.find((s) => s.email === email);
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

  async getGoalByName(name: string): Promise<GoalRecord | undefined> {
    const goals = await this.apiGet<GoalRecord[]>("/api/goals");
    return goals.find((g) => g.name === name);
  }

  // ─── Evaluation helpers ────────────────────────────────────────────────────

  async upsertEvaluation(
    classId: string,
    studentId: string,
    goalId: string,
    grade: string,
  ): Promise<void> {
    await fetch(`${BACKEND_URL}/api/classes/${classId}/evaluations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, goalId, grade }),
    });
  }

  // ─── Email / digest helpers ────────────────────────────────────────────────

  async cleanEmailQueue(): Promise<void> {
    await fetch(`${BACKEND_URL}/api/e2e/email-queue`, { method: "DELETE" });
  }

  async clearSentEmails(): Promise<void> {
    await fetch(`${BACKEND_URL}/api/e2e/sent-emails`, { method: "DELETE" });
  }

  async getEmailQueue(): Promise<EmailQueueEntry[]> {
    return this.apiGet<EmailQueueEntry[]>("/api/e2e/email-queue");
  }

  async getSentEmails(): Promise<SentEmail[]> {
    return this.apiGet<SentEmail[]>("/api/e2e/sent-emails");
  }

  async getSentEmailsFor(recipientEmail: string): Promise<SentEmail[]> {
    const all = await this.getSentEmails();
    return all.filter((e) => e.to === recipientEmail);
  }

  // Each "the daily digest job runs" increments the offset by 1 day so that
  // "runs" → processes today's entries (offset 1 = tomorrow as asOfDate),
  // "runs again on the same day" → same offset (nothing new to process),
  // "runs the following day" → offset 2 (processes entries added after the first run).
  async runDigest(): Promise<void> {
    this.digestOffset++;
    await this._triggerDigest(this.digestOffset);
  }

  async runDigestAgain(): Promise<void> {
    // Re-uses the same offset — queue was already drained, nothing to process.
    await this._triggerDigest(this.digestOffset);
  }

  async runDigestFollowingDay(): Promise<void> {
    this.digestOffset++;
    await this._triggerDigest(this.digestOffset);
  }

  private async _triggerDigest(daysOffset: number): Promise<void> {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    // Use local date components (not UTC via toISOString) to stay consistent with enqueue().
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const asOfDate = `${yyyy}-${mm}-${dd}`;
    await this.apiPost("/api/e2e/run-digest", { asOfDate });
  }

  resetDigestOffset(): void {
    this.digestOffset = 0;
  }
}

setWorldConstructor(World);
