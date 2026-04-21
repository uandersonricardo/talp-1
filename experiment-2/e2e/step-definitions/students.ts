import { DataTable, Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { World } from "../support/world";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_PATHS: Record<string, string> = {
  Alunos: "/alunos",
  Turmas: "/turmas",
  Metas: "/metas",
};

// Maps Portuguese field labels from the feature file to data-testid values.
// Shared between students and classes features — add new fields here as needed.
const FIELD_TEST_IDS: Record<string, string> = {
  // Student fields
  Nome: "student-name-input",
  CPF: "student-cpf-input",
  "E-mail": "student-email-input",
  // Class fields
  "Descrição": "class-description-input",
  "Ano": "class-year-input",
  "Semestre": "class-semester-select",
};

// Default CPF used when scenarios only specify a name (all 11 digits, not all same)
const DEFAULT_CPF = "111.444.777-35";

// ─── Background ───────────────────────────────────────────────────────────────

Given("I am on the {string} page", async function (this: World, pageName: string) {
  const path = PAGE_PATHS[pageName];
  if (!path) throw new Error(`Unknown page name: "${pageName}"`);
  await this.page.goto(path, { waitUntil: "networkidle" });
});

// ─── State setup (Given) ─────────────────────────────────────────────────────

// No-op: the Before hook already deleted all students before this scenario.
Given("no students are registered", function () {
  // clean state guaranteed by the Before hook
});

Given(
  "the following students are registered:",
  async function (this: World, dataTable: DataTable) {
    for (const row of dataTable.hashes()) {
      await this.createStudent(
        row["Name"] as string,
        row["CPF"] as string,
        row["Email"] as string,
      );
    }
    // Reload so React Query fetches the freshly created records
    await this.reloadPage();
  },
);

Given(
  "a student with CPF {string} is already registered",
  async function (this: World, cpf: string) {
    await this.createStudent("Aluno Existente", cpf, "existente@example.com");
    // No reload needed: the subsequent steps interact with the UI from scratch
  },
);

Given(
  "a student {string} with email {string} is registered",
  async function (this: World, name: string, email: string) {
    await this.createStudent(name, DEFAULT_CPF, email);
    await this.reloadPage();
  },
);

Given(
  "a student {string} with CPF {string} and email {string} is registered",
  async function (this: World, name: string, cpf: string, email: string) {
    await this.createStudent(name, cpf, email);
    await this.reloadPage();
  },
);

Given("a student {string} is registered", async function (this: World, name: string) {
  const email = `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
  await this.createStudent(name, DEFAULT_CPF, email);
  await this.reloadPage();
});

// ─── User actions (When) ──────────────────────────────────────────────────────

When("I click {string}", async function (this: World, label: string) {
  // Fast-path for a handful of buttons that share labels with other contexts and
  // could be ambiguous to a role-based selector. Everything else falls through to
  // a role-based lookup which works for any visible button.
  const testIdMap: Record<string, string> = {
    "Novo Aluno": "btn-new-student",
  };
  const testId = testIdMap[label];
  if (testId) {
    await this.page.getByTestId(testId).click();
  } else {
    await this.page.getByRole("button", { name: label, exact: true }).first().click();
  }
});

When(
  "I fill in {string} with {string}",
  async function (this: World, fieldLabel: string, value: string) {
    const testId = FIELD_TEST_IDS[fieldLabel];
    if (!testId) throw new Error(`Unknown field label: "${fieldLabel}"`);
    await this.page.getByTestId(testId).fill(value);
  },
);

// Alias for the edit scenarios — semantically "change X to Y"
When(
  "I change {string} to {string}",
  async function (this: World, fieldLabel: string, value: string) {
    const testId = FIELD_TEST_IDS[fieldLabel];
    if (!testId) throw new Error(`Unknown field label: "${fieldLabel}"`);
    await this.page.getByTestId(testId).fill(value);
  },
);

When(
  "I click the edit button for {string}",
  async function (this: World, name: string) {
    // Both student and class edit buttons carry an aria-label of "Editar <name>"
    await this.page.getByRole("button", { name: `Editar ${name}`, exact: true }).click();
  },
);

When(
  "I click the delete button for {string}",
  async function (this: World, name: string) {
    // Both student and class delete buttons carry an aria-label of "Excluir <name>"
    await this.page.getByRole("button", { name: `Excluir ${name}`, exact: true }).click();
  },
);

When("I confirm the deletion", async function (this: World) {
  await this.page.getByTestId("btn-confirm-delete").click();
});

When("I cancel the deletion", async function (this: World) {
  await this.page.getByTestId("btn-cancel-confirm").click();
});

// ─── Assertions (Then) ────────────────────────────────────────────────────────

Then("I should see an empty state message", async function (this: World) {
  // Any page-level empty state uses a data-testid ending in "-empty-state"
  await expect(this.page.locator("[data-testid$='-empty-state']").first()).toBeVisible();
});

Then("I should see a {string} button", async function (this: World, label: string) {
  await expect(this.page.getByRole("button", { name: label }).first()).toBeVisible();
});

Then(
  "I should see {int} students in the list",
  async function (this: World, count: number) {
    await expect(this.page.getByTestId("student-row")).toHaveCount(count);
  },
);

Then(
  "the list should include {string}",
  async function (this: World, name: string) {
    // Works for any visible data table on the page (students or classes)
    await expect(this.page.locator("table").getByText(name)).toBeVisible();
  },
);

Then(
  "I should see {string} in the student list",
  async function (this: World, value: string) {
    await expect(this.page.getByTestId("students-table").getByText(value)).toBeVisible();
  },
);

Then("I should see a success notification", async function (this: World) {
  await expect(
    this.page.locator('[data-testid="toast"][data-variant="success"]'),
  ).toBeVisible();
});

Then(
  "I should see a validation error for {string}",
  async function (this: World, fieldLabel: string) {
    // Validation error <p> elements are rendered below each input inside the open dialog
    const patterns: Record<string, RegExp> = {
      Nome: /nome é obrigatório/i,
      CPF: /cpf/i,
      "E-mail": /e-mail/i,
      "Descrição": /descrição é obrigatória/i,
      "Ano": /ano inválido/i,
      "Semestre": /semestre é obrigatório/i,
    };
    const pattern = patterns[fieldLabel];
    if (!pattern) throw new Error(`No error pattern for field: "${fieldLabel}"`);
    await expect(
      this.page.locator('[role="dialog"]').locator("p").filter({ hasText: pattern }),
    ).toBeVisible();
  },
);

Then("the modal should remain open", async function (this: World) {
  await expect(this.page.locator('[role="dialog"]')).toBeVisible();
});

Then(
  "I should see an error indicating the CPF is already in use",
  async function (this: World) {
    await expect(
      this.page.locator('[data-testid="toast"][data-variant="error"]'),
    ).toBeVisible();
  },
);

Then("the modal should be closed", async function (this: World) {
  await expect(this.page.locator('[role="dialog"]')).not.toBeVisible();
});

Then("no new student should appear in the list", async function (this: World) {
  // If no students exist the table is replaced by the empty state;
  // either way there are zero student-row elements.
  await expect(this.page.getByTestId("student-row")).toHaveCount(0);
});

Then(
  "{string} should no longer appear in the student list",
  async function (this: World, name: string) {
    // The table may be gone entirely (empty state) — not.toBeVisible() handles both cases.
    await expect(
      this.page.getByTestId("students-table").getByText(name),
    ).not.toBeVisible();
  },
);

Then(
  "{string} should still appear in the student list",
  async function (this: World, name: string) {
    await expect(
      this.page.getByTestId("students-table").getByText(name),
    ).toBeVisible();
  },
);

Then(
  "the {string} field should contain {string}",
  async function (this: World, fieldLabel: string, expectedValue: string) {
    const testId = FIELD_TEST_IDS[fieldLabel];
    if (!testId) throw new Error(`Unknown field label: "${fieldLabel}"`);
    await expect(this.page.getByTestId(testId)).toHaveValue(expectedValue);
  },
);
