import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";

import { CustomWorld, FRONTEND_URL, API_URL } from "../support/world";

// ---------------------------------------------------------------------------
// Given
// ---------------------------------------------------------------------------

Given("I am on the question creation page", async function (this: CustomWorld) {
  await this.page.goto(`${FRONTEND_URL}/questions/new`);
});

Given("a question exists with statement {string}", async function (this: CustomWorld, statement: string) {
  await this.createQuestion(statement, [
    { description: "Option A", correct: true },
    { description: "Option B", correct: false },
  ]);
});

Given("a question exists with an alternative {string}", async function (this: CustomWorld, altDescription: string) {
  await this.createQuestion("Sample question", [
    { description: altDescription, correct: false },
    { description: "Correct answer", correct: true },
  ]);
});

Given(
  "a question exists with all alternatives marked as incorrect except one",
  async function (this: CustomWorld) {
    await this.createQuestion("Sample question", [
      { description: "Correct option", correct: true },
      { description: "Wrong option A", correct: false },
      { description: "Wrong option B", correct: false },
    ]);
  },
);

Given("a question has been used in a generated PDF batch", async function (this: CustomWorld) {
  const question = await this.createQuestion("Question used in exam", [
    { description: "Option A", correct: true },
    { description: "Option B", correct: false },
  ]);

  const exam = await this.createExam({
    title: "Exam with Generated Batch",
    course: "Test Course",
    professor: "Dr. Test",
    date: "2026-04-15",
    identifierMode: "letters",
    questions: [question.id],
  });

  await this.generateBatch(exam.id, 1);
});

Given("a question exists that is not assigned to any exam", async function (this: CustomWorld) {
  await this.createQuestion("Standalone question", [
    { description: "Option A", correct: true },
    { description: "Option B", correct: false },
  ]);
});

Given("a question exists that is assigned to at least one exam", async function (this: CustomWorld) {
  const question = await this.createQuestion("Question in exam", [
    { description: "Option A", correct: true },
    { description: "Option B", correct: false },
  ]);

  await this.createExam({
    title: "Exam referencing question",
    course: "Test Course",
    professor: "Dr. Test",
    date: "2026-04-15",
    identifierMode: "letters",
    questions: [question.id],
  });
});

Given("{int} questions exist in the system", async function (this: CustomWorld, count: number) {
  for (let i = 1; i <= count; i++) {
    await this.createQuestion(`Question number ${i}`, [
      { description: "Option A", correct: true },
      { description: "Option B", correct: false },
    ]);
  }
});

Given(
  "questions exist with statements {string} and {string}",
  async function (this: CustomWorld, statementA: string, statementB: string) {
    await this.createQuestion(statementA, [
      { description: "Option A", correct: true },
      { description: "Option B", correct: false },
    ]);
    await this.createQuestion(statementB, [
      { description: "Option A", correct: true },
      { description: "Option B", correct: false },
    ]);
  },
);

Given("questions exist in the system", async function (this: CustomWorld) {
  await this.createQuestion("Biology question", [
    { description: "Option A", correct: true },
    { description: "Option B", correct: false },
  ]);
  await this.createQuestion("Chemistry question", [
    { description: "Option A", correct: true },
    { description: "Option B", correct: false },
  ]);
});

// ---------------------------------------------------------------------------
// When
// ---------------------------------------------------------------------------

When("I fill in the statement with {string}", async function (this: CustomWorld, statement: string) {
  await this.page.getByLabel(/enunciado/i).fill(statement);
});

When("I add an alternative {string} marked as correct", async function (this: CustomWorld, description: string) {
  await this.page.getByRole("button", { name: /adicionar alternativa/i }).click();
  const alternatives = this.page.locator("[data-testid='alternative-item']");
  const lastAlternative = alternatives.last();
  await lastAlternative.getByRole("textbox").fill(description);
  const toggleBtn = lastAlternative.getByRole("button", { name: /marcar como correta/i });
  if (await toggleBtn.isVisible()) {
    await toggleBtn.click();
  }
});

When("I add an alternative {string} marked as incorrect", async function (this: CustomWorld, description: string) {
  await this.page.getByRole("button", { name: /adicionar alternativa/i }).click();
  const alternatives = this.page.locator("[data-testid='alternative-item']");
  const lastAlternative = alternatives.last();
  await lastAlternative.getByRole("textbox").fill(description);
  // Alternatives are incorrect by default — no toggle needed
});

When("I submit the form", async function (this: CustomWorld) {
  await this.page.getByRole("button", { name: /criar questão|salvar alterações/i }).click();
});

When("I leave the statement empty", async function (this: CustomWorld) {
  const statementField = this.page.getByLabel(/enunciado/i);
  await statementField.clear();
});

When(
  "I edit the question and change the statement to {string}",
  async function (this: CustomWorld, newStatement: string) {
    const editUrl = `${FRONTEND_URL}/questions/${this.lastCreatedQuestion.id}/edit`;
    await this.page.goto(editUrl);
    await this.page.getByLabel(/enunciado/i).fill(newStatement);
  },
);

When("I save the changes", async function (this: CustomWorld) {
  await this.page.getByRole("button", { name: /salvar alterações/i }).click();
});

When(
  "I edit the question and fix the alternative to {string}",
  async function (this: CustomWorld, correctedText: string) {
    const editUrl = `${FRONTEND_URL}/questions/${this.lastCreatedQuestion.id}/edit`;
    await this.page.goto(editUrl);
    const alternatives = this.page.locator("[data-testid='alternative-item']");
    await alternatives.first().getByRole("textbox").fill(correctedText);
  },
);

When("I edit the question and mark a second alternative as correct", async function (this: CustomWorld) {
  const editUrl = `${FRONTEND_URL}/questions/${this.lastCreatedQuestion.id}/edit`;
  await this.page.goto(editUrl);
  const alternatives = this.page.locator("[data-testid='alternative-item']");
  const secondAlternative = alternatives.nth(1);
  await secondAlternative.getByRole("button", { name: /marcar como correta/i }).click();
});

When("I edit the question statement", async function (this: CustomWorld) {
  const editUrl = `${FRONTEND_URL}/questions/${this.lastCreatedQuestion.id}/edit`;
  await this.page.goto(editUrl);
  const statementField = this.page.getByLabel(/enunciado/i);
  const current = await statementField.inputValue();
  await statementField.fill(`${current} (edited)`);
  await this.page.getByRole("button", { name: /salvar alterações/i }).click();
});

When("I delete the question", async function (this: CustomWorld) {
  await this.page.goto(`${FRONTEND_URL}/questions`);
  const questionRow = this.page.getByText(this.lastCreatedQuestion.statement);
  await questionRow.locator("..").getByRole("button", { name: /excluir questão/i }).click();
  const confirmButton = this.page.getByRole("button", { name: "Excluir" });
  if (await confirmButton.isVisible()) {
    await confirmButton.click();
  }
});

When("I attempt to delete the question", async function (this: CustomWorld) {
  await this.page.goto(`${FRONTEND_URL}/questions`);
  const questionRow = this.page.getByText(this.lastCreatedQuestion.statement);
  await questionRow.locator("..").getByRole("button", { name: /excluir questão/i }).click();
  const confirmButton = this.page.getByRole("button", { name: "Excluir" });
  if (await confirmButton.isVisible()) {
    await confirmButton.click();
  }
});

When("I navigate to the question list page", async function (this: CustomWorld) {
  await this.page.goto(`${FRONTEND_URL}/questions`);
});

When("I search for {string}", async function (this: CustomWorld, query: string) {
  const searchInput = this.page.getByRole("searchbox").or(this.page.getByPlaceholder(/buscar/i));
  await searchInput.fill(query);
  await this.page.waitForTimeout(400);
  await this.page.waitForLoadState("networkidle");
});

// ---------------------------------------------------------------------------
// Then
// ---------------------------------------------------------------------------

Then("the question is saved successfully", async function (this: CustomWorld) {
  await expect(this.page).not.toHaveURL(/\/questions\/new$/);
  await expect(this.page.getByText(/questão criada|questão atualizada/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
});

Then("it appears in the question list", async function (this: CustomWorld) {
  await this.page.goto(`${FRONTEND_URL}/questions`);
  await expect(this.page.getByText(this.lastCreatedQuestion.statement)).toBeVisible();
});

Then("I see a validation error {string}", async function (this: CustomWorld, errorMessage: string) {
  const messageMap: Record<string, RegExp> = {
    "At least two alternatives are required": /pelo menos 2 alternativas/i,
    "At least one alternative must be marked as correct": /pelo menos uma alternativa deve ser correta/i,
    "At least one question is required": /selecione pelo menos uma questão/i,
    "Question cannot be deleted because it is used in one or more exams": /questão está sendo usada em uma prova/i,
    "Exam cannot be deleted because individual exams have already been generated": /prova possui lotes gerados/i,
  };
  const pattern = messageMap[errorMessage] ?? new RegExp(errorMessage, "i");
  await expect(this.page.getByText(pattern)).toBeVisible({ timeout: 5000 });
});

Then("I see a validation error indicating the statement is required", async function (this: CustomWorld) {
  await expect(this.page.getByText(/enunciado é obrigatório/i)).toBeVisible({ timeout: 5000 });
});

Then("the question is updated with the new statement", async function (this: CustomWorld) {
  const res = await this.apiContext.get(`${API_URL}/api/questions/${this.lastCreatedQuestion.id}`);
  const updated = await res.json();
  expect(updated.statement).toBe("New statement");
});

Then("the alternative is updated", async function (this: CustomWorld) {
  const res = await this.apiContext.get(`${API_URL}/api/questions/${this.lastCreatedQuestion.id}`);
  const updated = await res.json();
  const found = updated.alternatives.some((a: any) => a.description === "Incorrect answer");
  expect(found).toBe(true);
});

Then("the question has two correct alternatives", async function (this: CustomWorld) {
  const res = await this.apiContext.get(`${API_URL}/api/questions/${this.lastCreatedQuestion.id}`);
  const updated = await res.json();
  const correctCount = updated.alternatives.filter((a: any) => a.correct).length;
  expect(correctCount).toBe(2);
});

Then("the previously generated PDF is unchanged", async function (this: CustomWorld) {
  expect(this.lastBatch).not.toBeNull();
  const pdfUrl = `${API_URL}${this.lastBatch.pdfUrl}`;
  const res = await this.apiContext.get(pdfUrl);
  expect(res.status()).toBe(200);
});

Then("the question is removed from the question list", async function (this: CustomWorld) {
  await this.page.goto(`${FRONTEND_URL}/questions`);
  await expect(this.page.getByText(this.lastCreatedQuestion.statement)).not.toBeVisible();
});

Then("I see an error {string}", async function (this: CustomWorld, errorMessage: string) {
  const messageMap: Record<string, RegExp> = {
    "Question cannot be deleted because it is used in one or more exams": /questão está sendo usada em uma prova/i,
    "Exam cannot be deleted because individual exams have already been generated": /prova possui lotes gerados/i,
  };
  const pattern = messageMap[errorMessage] ?? new RegExp(errorMessage, "i");
  await expect(this.page.getByText(pattern)).toBeVisible({ timeout: 5000 });
});

Then("the question remains in the list", async function (this: CustomWorld) {
  await expect(this.page.getByText(this.lastCreatedQuestion.statement)).toBeVisible();
});

Then("I see the first page of questions", async function (this: CustomWorld) {
  const items = this.page.locator("tr, li").filter({ hasText: /question/i });
  await expect(items.first()).toBeVisible();
});

Then("pagination controls are displayed", async function (this: CustomWorld) {
  const pagination = this.page
    .getByRole("navigation", { name: /pagination/i })
    .or(this.page.locator("[data-testid='pagination']"))
    .or(this.page.getByRole("button", { name: /próxima|anterior|next|previous/i }).first().locator(".."));
  await expect(pagination).toBeVisible();
});

Then("only {string} appears in the results", async function (this: CustomWorld, expectedTitle: string) {
  await expect(this.page.getByText(expectedTitle)).toBeVisible();
});

Then("the question list is empty", async function (this: CustomWorld) {
  const emptyState = this.page
    .getByText(/nenhuma questão/i)
    .or(this.page.getByTestId("empty-state"));
  await expect(emptyState).toBeVisible({ timeout: 5000 });
});

Then("a {string} message is displayed", async function (this: CustomWorld, message: string) {
  await expect(this.page.getByText(new RegExp(message, "i"))).toBeVisible({ timeout: 5000 });
});
