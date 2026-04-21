import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { World } from "../support/world";

// ─── State setup (Given) ─────────────────────────────────────────────────────

Given(
  "the goals {string}, {string}, and {string} exist",
  async function (this: World, g1: string, g2: string, g3: string) {
    await this.createGoal(g1);
    await this.createGoal(g2);
    await this.createGoal(g3);
    // No reload — the Background navigates to a page immediately after.
  },
);

Given(
  "the goal {string} and {string} exist",
  async function (this: World, g1: string, g2: string) {
    await this.createGoal(g1);
    await this.createGoal(g2);
  },
);

Given("the goal {string} exists", async function (this: World, name: string) {
  await this.createGoal(name);
});

Given(
  "I am on the detail page for {string}",
  async function (this: World, classDescription: string) {
    const cls = await this.getClassByDescription(classDescription);
    if (!cls) throw new Error(`Class "${classDescription}" not found`);
    await this.page.goto(`/turmas/${cls.id}`, { waitUntil: "networkidle" });
  },
);

// Sets up an existing grade and stores the context for follow-up steps that
// say "the instructor updates the grade to X" without repeating names.
// Auto-creates class/student/goal if they don't exist, so persistence.feature
// scenarios (which have no Background) can use this step directly.
Given(
  "{string} has the grade {string} for {string} in {string}",
  async function (
    this: World,
    studentName: string,
    grade: string,
    goalName: string,
    classDescription: string,
  ) {
    let cls = await this.getClassByDescription(classDescription);
    if (!cls) cls = await this.createClass(classDescription, 2026, 1);

    let student = await this.getStudentByName(studentName);
    if (!student) student = await this.createStudentAuto(studentName);

    // Enroll if not already a member of this class.
    if (!cls.studentIds.includes(student.id)) {
      await this.enrollStudentInClass(cls.id, student.id);
    }

    let goal = await this.getGoalByName(goalName);
    if (!goal) goal = await this.createGoal(goalName);

    await this.upsertEvaluation(cls.id, student.id, goal.id, grade);
    this.lastEvalContext = { studentId: student.id, goalId: goal.id, classId: cls.id };

    await this.reloadPage();
  },
);

Given(
  "many goals exist causing the table to overflow horizontally",
  async function (this: World) {
    for (let i = 1; i <= 10; i++) {
      await this.createGoal(`Meta Extra ${i}`);
    }
    await this.reloadPage();
  },
);

// ─── User actions (When) ──────────────────────────────────────────────────────

When(
  "I click the cell for {string} and {string}",
  async function (this: World, studentName: string, goalName: string) {
    const student = await this.getStudentByName(studentName);
    if (!student) throw new Error(`Student "${studentName}" not found`);
    const goal = await this.getGoalByName(goalName);
    if (!goal) throw new Error(`Goal "${goalName}" not found`);

    const cell = this.page.locator(
      `[data-testid="grade-cell"][data-student-id="${student.id}"][data-goal-id="${goal.id}"]`,
    );
    await cell.click();
  },
);

When("I select the grade {string}", async function (this: World, grade: string) {
  await this.page.getByTestId(`grade-option-${grade}`).click();
  // Wait for the mutation to settle before the next step.
  await this.page.waitForLoadState("networkidle");
});

When("I scroll the evaluation table to the right", async function (this: World) {
  // The scrollable container is the overflow wrapper wrapping the table.
  await this.page.getByTestId("evaluations-table").evaluate((table) => {
    const container = table.parentElement;
    if (container) container.scrollLeft = container.scrollWidth;
  });
});

// ─── Assertions (Then) ────────────────────────────────────────────────────────

Then(
  "the evaluation table should have a row for {string}",
  async function (this: World, studentName: string) {
    await expect(
      this.page.getByTestId("evaluations-table").getByText(studentName),
    ).toBeVisible();
  },
);

Then(
  "the evaluation table should have a column for {string}",
  async function (this: World, goalName: string) {
    await expect(
      this.page.getByTestId("evaluations-table").locator("th").filter({ hasText: goalName }),
    ).toBeVisible();
  },
);

Then(
  "every cell in the evaluation table should be empty",
  async function (this: World) {
    const cells = this.page.getByTestId("grade-cell");
    const count = await cells.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(cells.nth(i)).toHaveText("—");
    }
  },
);

Then("the student name column should remain visible", async function (this: World) {
  // The first <th> ("Aluno") is position:sticky left-0. After scrolling the table
  // right, it should remain pinned to the left edge of its scrollable container.
  const table = this.page.getByTestId("evaluations-table");
  const header = table.locator("th").first();
  await expect(header).toBeVisible();

  // Measure the container's left edge — the sticky column must stay at that position.
  const containerLeft = await table.evaluate((el) => el.parentElement!.getBoundingClientRect().left);
  const box = await header.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.abs(box!.x - containerLeft)).toBeLessThan(5);
});

Then(
  "the cell for {string} and {string} should display {string}",
  async function (this: World, studentName: string, goalName: string, grade: string) {
    const student = await this.getStudentByName(studentName);
    if (!student) throw new Error(`Student "${studentName}" not found`);
    const goal = await this.getGoalByName(goalName);
    if (!goal) throw new Error(`Goal "${goalName}" not found`);

    const cell = this.page.locator(
      `[data-testid="grade-cell"][data-student-id="${student.id}"][data-goal-id="${goal.id}"]`,
    );
    await expect(cell).toHaveText(grade);
  },
);

Then(
  "the cell for {string} and {string} should remain empty",
  async function (this: World, studentName: string, goalName: string) {
    const student = await this.getStudentByName(studentName);
    if (!student) throw new Error(`Student "${studentName}" not found`);
    const goal = await this.getGoalByName(goalName);
    if (!goal) throw new Error(`Goal "${goalName}" not found`);

    const cell = this.page.locator(
      `[data-testid="grade-cell"][data-student-id="${student.id}"][data-goal-id="${goal.id}"]`,
    );
    await expect(cell).toHaveText("—");
  },
);

Then(
  "the cell for {string} and {string} should be empty",
  async function (this: World, studentName: string, goalName: string) {
    const student = await this.getStudentByName(studentName);
    if (!student) throw new Error(`Student "${studentName}" not found`);
    const goal = await this.getGoalByName(goalName);
    if (!goal) throw new Error(`Goal "${goalName}" not found`);

    const cell = this.page.locator(
      `[data-testid="grade-cell"][data-student-id="${student.id}"][data-goal-id="${goal.id}"]`,
    );
    await expect(cell).toHaveText("—");
  },
);

Then(
  "{string} should be highlighted as the selected option",
  async function (this: World, grade: string) {
    // Selected grade buttons receive an inline `outline` style (see ClassDetailPage).
    const btn = this.page.getByTestId(`grade-option-${grade}`);
    await expect(btn).toBeVisible();
    const outline = await btn.evaluate((el) => (el as any).style.outline);
    expect(outline).toBeTruthy();
  },
);

Then(
  "the {string} cell should have a different visual style than the {string} cell",
  async function (this: World, grade1: string, grade2: string) {
    const cell1 = this.page.getByTestId("grade-cell").filter({ hasText: grade1 }).first();
    const cell2 = this.page.getByTestId("grade-cell").filter({ hasText: grade2 }).first();

    const bg1 = await cell1.evaluate((el) => (el as any).style.backgroundColor);
    const bg2 = await cell2.evaluate((el) => (el as any).style.backgroundColor);

    expect(bg1).not.toEqual(bg2);
  },
);
