import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { BACKEND_URL } from "../support/server";
import { World } from "../support/world";

// ─── State setup (Given) ─────────────────────────────────────────────────────

// Updates a student's email via the backend API.
// "her" is a narrative pronoun — the student is identified by the name used
// in the preceding "a student X is registered" step.
Given(
  "I update her email to {string}",
  async function (this: World, newEmail: string) {
    const students = await this.apiGet<Array<{ id: string; name: string; cpf: string; email: string }>>(
      "/api/students",
    );
    if (students.length === 0) throw new Error("No students registered");
    const s = students[0];
    const res = await fetch(`${BACKEND_URL}/api/students/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: s.name, cpf: s.cpf, email: newEmail }),
    });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      throw new Error(json.error ?? "Failed to update student");
    }
  },
);

// Deletes a student by name via the backend API.
Given("I delete {string}", async function (this: World, studentName: string) {
  const student = await this.getStudentByName(studentName);
  if (!student) throw new Error(`Student "${studentName}" not found`);
  await fetch(`${BACKEND_URL}/api/students/${student.id}`, { method: "DELETE" });
});

// Records a grade via API using persistence-feature phrasing ("I record" / "and").
Given(
  "I record the grade {string} for {string} and {string} in {string}",
  async function (
    this: World,
    grade: string,
    studentName: string,
    goalName: string,
    classDescription: string,
  ) {
    const cls = await this.getClassByDescription(classDescription);
    if (!cls) throw new Error(`Class "${classDescription}" not found`);
    const student = await this.getStudentByName(studentName);
    if (!student) throw new Error(`Student "${studentName}" not found`);
    const goal = await this.getGoalByName(goalName);
    if (!goal) throw new Error(`Goal "${goalName}" not found`);

    await this.upsertEvaluation(cls.id, student.id, goal.id, grade);
    this.lastEvalContext = { studentId: student.id, goalId: goal.id, classId: cls.id };
  },
);

// Updates an existing grade using the context stored by the last grade setup step.
Given("I update the grade to {string}", async function (this: World, grade: string) {
  if (!this.lastEvalContext) throw new Error("No evaluation context — call a grade setup step first");
  const { classId, studentId, goalId } = this.lastEvalContext;
  await this.upsertEvaluation(classId, studentId, goalId, grade);
});

// ─── User actions (When) ──────────────────────────────────────────────────────

When("I reload the page", async function (this: World) {
  await this.page.reload({ waitUntil: "networkidle" });
});

When("I navigate to the {string} page", async function (this: World, pageName: string) {
  await this.navigateTo(pageName);
});

// ─── Assertions (Then) ────────────────────────────────────────────────────────

Then(
  "{string} should show the email {string}",
  async function (this: World, studentName: string, expectedEmail: string) {
    // Verify the email appears in the same row as the student name.
    const row = this.page
      .getByTestId("student-row")
      .filter({ hasText: studentName })
      .filter({ hasText: expectedEmail });
    await expect(row).toBeVisible();
  },
);

Then(
  "{string} should not appear in the student list",
  async function (this: World, studentName: string) {
    const table = this.page.getByTestId("students-table");
    const tableVisible = await table.isVisible().catch(() => false);
    if (tableVisible) {
      await expect(table.getByText(studentName)).not.toBeVisible();
    }
    // If the table is gone entirely (empty state), the student is definitely absent.
  },
);
