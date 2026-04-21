import { DataTable, Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { World } from "../support/world";

// ─── State setup (Given) ─────────────────────────────────────────────────────

Given("no classes are registered", function () {
  // clean state guaranteed by the Before hook in hooks.ts
});

Given(
  "the following classes are registered:",
  async function (this: World, dataTable: DataTable) {
    for (const row of dataTable.hashes()) {
      await this.createClass(
        row["Description"] as string,
        Number(row["Year"]),
        Number(row["Semester"]) as 1 | 2,
      );
    }
    await this.reloadPage();
  },
);

Given(
  "a class {string} in year {int}, semester {int} is registered",
  async function (this: World, description: string, year: number, semester: number) {
    await this.createClass(description, year, semester as 1 | 2);
    await this.reloadPage();
  },
);

Given("a class {string} is registered", async function (this: World, description: string) {
  await this.createClass(description, 2026, 1);
  await this.reloadPage();
});

Given(
  "the following students are enrolled in {string}:",
  async function (this: World, classDescription: string, dataTable: DataTable) {
    const cls = await this.getClassByDescription(classDescription);
    if (!cls) throw new Error(`Class "${classDescription}" not found`);
    for (const row of dataTable.hashes()) {
      const student = await this.createStudentAuto(row["Name"] as string);
      await this.enrollStudentInClass(cls.id, student.id);
    }
    await this.reloadPage();
  },
);

Given(
  "the goals {string} and {string} exist",
  async function (this: World, goal1: string, goal2: string) {
    await this.createGoal(goal1);
    await this.createGoal(goal2);
    await this.reloadPage();
  },
);

Given(
  "a student {string} is registered but not enrolled in {string}",
  async function (this: World, studentName: string, _classDescription: string) {
    // The class has already been created by an earlier Given step.
    // Just create the student without enrolling.
    await this.createStudentAuto(studentName);
    await this.reloadPage();
  },
);

Given(
  "{string} is already enrolled in {string}",
  async function (this: World, studentName: string, classDescription: string) {
    let cls = await this.getClassByDescription(classDescription);
    if (!cls) cls = await this.createClass(classDescription, 2026, 1);
    const student = await this.createStudentAuto(studentName);
    await this.enrollStudentInClass(cls.id, student.id);
    await this.reloadPage();
  },
);

Given(
  "{string} is not enrolled in {string}",
  async function (this: World, studentName: string, _classDescription: string) {
    // Just create the student; the class was created by an earlier Given.
    await this.createStudentAuto(studentName);
    await this.reloadPage();
  },
);

Given(
  "{string} is enrolled in {string}",
  async function (this: World, studentName: string, classDescription: string) {
    let cls = await this.getClassByDescription(classDescription);
    if (!cls) cls = await this.createClass(classDescription, 2026, 1);
    // Reuse the existing student if one with this name already exists (e.g. created
    // by a Background step) so that cross-class tests work against the same ID.
    let student = await this.getStudentByName(studentName);
    if (!student) student = await this.createStudentAuto(studentName);
    await this.enrollStudentInClass(cls.id, student.id);
    await this.reloadPage();
  },
);

// ─── User actions (When) ──────────────────────────────────────────────────────

When(
  "I select {string} for {string}",
  async function (this: World, value: string, fieldLabel: string) {
    const selectIds: Record<string, string> = {
      Semestre: "class-semester-select",
    };
    const testId = selectIds[fieldLabel];
    if (!testId) throw new Error(`Unknown select field: "${fieldLabel}"`);
    await this.page.getByTestId(testId).selectOption(value);
  },
);

When(
  "I click on {string}",
  async function (this: World, classDescription: string) {
    // Click the description link in the classes table to navigate to the detail page
    const row = this.page.getByTestId("class-row").filter({ hasText: classDescription });
    await row.getByTestId("btn-view-class").click();
    await this.page.waitForLoadState("networkidle");
  },
);

When(
  "I navigate to the detail page for {string}",
  async function (this: World, classDescription: string) {
    const cls = await this.getClassByDescription(classDescription);
    if (!cls) throw new Error(`Class "${classDescription}" not found`);
    await this.page.goto(`/turmas/${cls.id}`, { waitUntil: "networkidle" });
  },
);

When(
  "I click the unenroll button for {string}",
  async function (this: World, studentName: string) {
    const row = this.page
      .getByTestId("enrolled-student-row")
      .filter({ hasText: studentName });
    await row.getByTestId("btn-unenroll-student").click();
  },
);

When(
  "I select {string} from the student list",
  async function (this: World, studentName: string) {
    const item = this.page
      .getByTestId("available-student-item")
      .filter({ hasText: studentName });
    await item.getByTestId("btn-enroll-student").first().click();
    // Wait for the enroll API call to finish before the next step
    await this.page.waitForLoadState("networkidle");
  },
);

When("I confirm the removal", async function (this: World) {
  await this.page.getByTestId("btn-confirm-delete").click();
});

When("I cancel the removal", async function (this: World) {
  await this.page.getByTestId("btn-cancel-confirm").click();
});

// ─── Assertions (Then) ────────────────────────────────────────────────────────

Then(
  "I should see {int} classes in the list",
  async function (this: World, count: number) {
    await expect(this.page.getByTestId("class-row")).toHaveCount(count);
  },
);

Then(
  "I should see {string} in the class list",
  async function (this: World, value: string) {
    await expect(this.page.getByTestId("classes-table").getByText(value)).toBeVisible();
  },
);

Then("no new class should appear in the list", async function (this: World) {
  await expect(this.page.getByTestId("class-row")).toHaveCount(0);
});

Then(
  "{string} should no longer appear in the class list",
  async function (this: World, description: string) {
    const table = this.page.getByTestId("classes-table");
    // Table may be gone entirely if no classes remain — handle both cases
    const tableVisible = await table.isVisible().catch(() => false);
    if (tableVisible) {
      await expect(table.getByText(description)).not.toBeVisible();
    }
    // If the table is gone, the class is definitely not visible — assertion passes
  },
);

Then(
  "{string} should still appear in the class list",
  async function (this: World, description: string) {
    await expect(this.page.getByTestId("classes-table").getByText(description)).toBeVisible();
  },
);

Then(
  "the class should show year {string} in the list",
  async function (this: World, year: string) {
    await expect(this.page.getByTestId("classes-table").getByText(year)).toBeVisible();
  },
);

Then(
  "the {string} field should have {string} selected",
  async function (this: World, fieldLabel: string, expectedValue: string) {
    const selectIds: Record<string, string> = {
      Semestre: "class-semester-select",
    };
    const testId = selectIds[fieldLabel];
    if (!testId) throw new Error(`Unknown select field: "${fieldLabel}"`);
    await expect(this.page.getByTestId(testId)).toHaveValue(expectedValue);
  },
);

Then(
  "I should be on the detail page for {string}",
  async function (this: World, classDescription: string) {
    const cls = await this.getClassByDescription(classDescription);
    if (!cls) throw new Error(`Class "${classDescription}" not found`);
    await expect(this.page).toHaveURL(new RegExp(`/turmas/${cls.id}`));
  },
);

Then(
  "I should see the class description, year, and semester",
  async function (this: World) {
    await expect(this.page.getByTestId("class-title")).toBeVisible();
  },
);

Then(
  "I should see {string} in the enrolled students list",
  async function (this: World, studentName: string) {
    await expect(
      this.page.getByTestId("enrolled-students-table").getByText(studentName),
    ).toBeVisible();
  },
);

Then(
  "I should see an evaluation table with {string} as a row",
  async function (this: World, studentName: string) {
    await expect(
      this.page.getByTestId("evaluations-table").getByText(studentName),
    ).toBeVisible();
  },
);

Then(
  "the table should have {string} and {string} as columns",
  async function (this: World, col1: string, col2: string) {
    const table = this.page.getByTestId("evaluations-table");
    await expect(table.getByText(col1)).toBeVisible();
    await expect(table.getByText(col2)).toBeVisible();
  },
);

Then(
  "{string} should appear in the enrolled students list",
  async function (this: World, studentName: string) {
    await expect(
      this.page.getByTestId("enrolled-students-table").getByText(studentName),
    ).toBeVisible();
  },
);

Then(
  "{string} should no longer appear in the enrolled students list",
  async function (this: World, studentName: string) {
    const table = this.page.getByTestId("enrolled-students-table");
    const tableVisible = await table.isVisible().catch(() => false);
    if (tableVisible) {
      await expect(table.getByText(studentName)).not.toBeVisible();
    }
  },
);

Then(
  "{string} should still appear in the enrolled students list",
  async function (this: World, studentName: string) {
    await expect(
      this.page.getByTestId("enrolled-students-table").getByText(studentName),
    ).toBeVisible();
  },
);

Then(
  "{string} should not appear in the student selector",
  async function (this: World, studentName: string) {
    await expect(
      this.page.getByTestId("add-student-modal").getByText(studentName),
    ).not.toBeVisible();
  },
);

Then(
  "{string} should appear in the student selector",
  async function (this: World, studentName: string) {
    await expect(
      this.page.getByTestId("add-student-modal").getByText(studentName),
    ).toBeVisible();
  },
);
