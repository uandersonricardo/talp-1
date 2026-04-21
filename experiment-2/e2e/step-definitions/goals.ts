import { DataTable, Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { World } from "../support/world";

// ─── State setup (Given) ─────────────────────────────────────────────────────

// No-op: the Before hook already deleted all goals before this scenario.
Given("no goals are registered", function () {
  // clean state guaranteed by the Before hook
});

Given(
  "the following goals are registered:",
  async function (this: World, dataTable: DataTable) {
    for (const row of dataTable.hashes()) {
      await this.createGoal(row["Name"] as string);
    }
    await this.reloadPage();
  },
);

// Used in scenarios where a pre-existing goal is needed to test duplicate creation.
Given(
  "a goal {string} is already registered",
  async function (this: World, name: string) {
    await this.createGoal(name);
    // Reload so React Query picks up the new record before the user types in the form.
    await this.reloadPage();
  },
);

Given(
  "a goal {string} is registered",
  async function (this: World, name: string) {
    await this.createGoal(name);
    await this.reloadPage();
  },
);

// Sets up a goal, a class, a student enrolled in that class, and an evaluation linking all three.
Given(
  "{string} has a grade for {string} in {string}",
  async function (
    this: World,
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

    await this.upsertEvaluation(cls.id, student.id, goal.id, "MA");
    // No page reload needed: the next When step navigates away from /metas.
  },
);

// ─── User actions (When) ──────────────────────────────────────────────────────

When(
  "I fill in the new goal field with {string}",
  async function (this: World, value: string) {
    await this.page.getByTestId("goal-name-input").fill(value);
  },
);

// Explicitly clears the field (it is blank by default, but a prior step might have filled it).
When("I leave the new goal field blank", async function (this: World) {
  await this.page.getByTestId("goal-name-input").fill("");
});

// ─── Assertions (Then) ────────────────────────────────────────────────────────

Then(
  "I should see {int} goals in the list",
  async function (this: World, count: number) {
    await expect(this.page.getByTestId("goal-row")).toHaveCount(count);
  },
);

Then(
  "I should see {string} in the goal list",
  async function (this: World, name: string) {
    await expect(this.page.getByTestId("goals-table").getByText(name)).toBeVisible();
  },
);

Then("no new goal should appear in the list", async function (this: World) {
  // Table is absent (empty state shown) or has no rows.
  await expect(this.page.getByTestId("goal-row")).toHaveCount(0);
});

Then(
  "I should see an error indicating the goal name is already in use",
  async function (this: World) {
    await expect(
      this.page.locator('[data-testid="toast"][data-variant="error"]'),
    ).toBeVisible();
  },
);

Then(
  "{string} should no longer appear in the goal list",
  async function (this: World, name: string) {
    const table = this.page.getByTestId("goals-table");
    const tableVisible = await table.isVisible().catch(() => false);
    if (tableVisible) {
      await expect(table.getByText(name)).not.toBeVisible();
    }
    // If the table is gone entirely (empty state), the goal is definitely absent.
  },
);

Then(
  "{string} should still appear in the goal list",
  async function (this: World, name: string) {
    await expect(this.page.getByTestId("goals-table").getByText(name)).toBeVisible();
  },
);

Then(
  "the evaluation table should not have a {string} column",
  async function (this: World, columnName: string) {
    const table = this.page.getByTestId("evaluations-table");
    await expect(table.locator("th").filter({ hasText: columnName })).not.toBeVisible();
  },
);
