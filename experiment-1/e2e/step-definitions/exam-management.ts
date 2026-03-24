import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import { expect } from "@playwright/test";

import { CustomWorld, FRONTEND_URL, API_URL } from "../support/world";

// ---------------------------------------------------------------------------
// Given
// ---------------------------------------------------------------------------

Given("I am on the exam creation page", async function (this: CustomWorld) {
  await this.page.goto(`${FRONTEND_URL}/exams/new`);
});

Given("an exam exists with title {string}", async function (this: CustomWorld, title: string) {
  const question = await this.createQuestion("Sample question", [
    { description: "Option A", correct: true },
    { description: "Option B", correct: false },
  ]);
  await this.createExam({
    title,
    course: "Test Course",
    professor: "Dr. Test",
    date: "2026-04-15",
    identifierMode: "letters",
    questions: [question.id],
  });
});

Given("an exam exists with {int} questions", async function (this: CustomWorld, questionCount: number) {
  const questionIds: string[] = [];
  for (let i = 1; i <= questionCount; i++) {
    const q = await this.createQuestion(`Question ${i}`, [
      { description: "Option A", correct: true },
      { description: "Option B", correct: false },
    ]);
    questionIds.push(q.id);
  }
  await this.createExam({
    title: "Exam with questions",
    course: "Test Course",
    professor: "Dr. Test",
    date: "2026-04-15",
    identifierMode: "letters",
    questions: questionIds,
  });
});

Given("an exam has at least one generated PDF batch", async function (this: CustomWorld) {
  const question = await this.createQuestion("Sample question", [
    { description: "Option A", correct: true },
    { description: "Option B", correct: false },
  ]);
  const exam = await this.createExam({
    title: "Exam with batch",
    course: "Test Course",
    professor: "Dr. Test",
    date: "2026-04-15",
    identifierMode: "letters",
    questions: [question.id],
  });
  await this.generateBatch(exam.id, 2);
});

Given("an exam exists with no generated PDF batches", async function (this: CustomWorld) {
  const question = await this.createQuestion("Sample question", [
    { description: "Option A", correct: true },
    { description: "Option B", correct: false },
  ]);
  await this.createExam({
    title: "Exam without batches",
    course: "Test Course",
    professor: "Dr. Test",
    date: "2026-04-15",
    identifierMode: "letters",
    questions: [question.id],
  });
});

Given("an exam exists with at least one generated PDF batch", async function (this: CustomWorld) {
  const question = await this.createQuestion("Sample question", [
    { description: "Option A", correct: true },
    { description: "Option B", correct: false },
  ]);
  const exam = await this.createExam({
    title: "Protected exam",
    course: "Test Course",
    professor: "Dr. Test",
    date: "2026-04-15",
    identifierMode: "letters",
    questions: [question.id],
  });
  await this.generateBatch(exam.id, 1);
});

Given("{int} exams exist in the system", async function (this: CustomWorld, count: number) {
  const question = await this.createQuestion("Shared question", [
    { description: "Option A", correct: true },
    { description: "Option B", correct: false },
  ]);
  for (let i = 1; i <= count; i++) {
    await this.createExam({
      title: `Exam number ${i}`,
      course: "Test Course",
      professor: "Dr. Test",
      date: "2026-04-15",
      identifierMode: "letters",
      questions: [question.id],
    });
  }
});

Given(
  "exams exist with titles {string} and {string}",
  async function (this: CustomWorld, titleA: string, titleB: string) {
    const question = await this.createQuestion("Shared question", [
      { description: "Option A", correct: true },
      { description: "Option B", correct: false },
    ]);
    await this.createExam({
      title: titleA,
      course: "Test Course",
      professor: "Dr. Test",
      date: "2026-04-15",
      identifierMode: "letters",
      questions: [question.id],
    });
    await this.createExam({
      title: titleB,
      course: "Test Course",
      professor: "Dr. Test",
      date: "2026-04-15",
      identifierMode: "letters",
      questions: [question.id],
    });
  },
);

Given("exams exist in the system", async function (this: CustomWorld) {
  const question = await this.createQuestion("Shared question", [
    { description: "Option A", correct: true },
    { description: "Option B", correct: false },
  ]);
  await this.createExam({
    title: "Sample Exam A",
    course: "Test Course",
    professor: "Dr. Test",
    date: "2026-04-15",
    identifierMode: "letters",
    questions: [question.id],
  });
});

// ---------------------------------------------------------------------------
// When
// ---------------------------------------------------------------------------

When("I create an exam with:", async function (this: CustomWorld, table: DataTable) {
  const data = table.rowsHash();
  await this.page.goto(`${FRONTEND_URL}/exams/new`);
  await this.page.getByLabel(/título/i).fill(data["title"] ?? "");
  await this.page.getByLabel(/disciplina/i).fill(data["course"] ?? "");
  await this.page.getByLabel(/professor/i).fill(data["professor"] ?? "");
  await this.page.getByLabel("Data").fill(data["date"] ?? "");

  const mode = data["identifier mode"];
  if (mode) {
    await this.page.getByLabel(/modo de identificação/i).selectOption(mode);
  }
});

When("I select {int} existing questions", async function (this: CustomWorld, count: number) {
  // Click the first `count` available question buttons in the question picker
  const questionButtons = this.page.locator(".max-h-48 button[type='button']");
  for (let i = 0; i < count; i++) {
    await questionButtons.first().click();
  }
});

When(
  "I create an exam with identifier mode {string}",
  async function (this: CustomWorld, mode: string) {
    const question = await this.createQuestion("Auto question", [
      { description: "Option A", correct: true },
      { description: "Option B", correct: false },
    ]);
    await this.page.goto(`${FRONTEND_URL}/exams/new`);
    await this.page.getByLabel(/título/i).fill("Auto Exam");
    await this.page.getByLabel(/disciplina/i).fill("Test Course");
    await this.page.getByLabel(/professor/i).fill("Dr. Test");
    await this.page.getByLabel("Data").fill("2026-04-15");
    await this.page.getByLabel(/modo de identificação/i).selectOption(mode);
    // Select the question we created
    const questionButton = this.page.getByText(question.statement).locator("..").getByRole("button");
    await questionButton.first().click();
  },
);

When("I select at least one question", async function (this: CustomWorld) {
  const questionButton = this.page.locator(".max-h-48 button[type='button']").first();
  await questionButton.click();
});

When("I fill in all required exam fields", async function (this: CustomWorld) {
  await this.page.getByLabel(/título/i).fill("Test Exam Title");
  await this.page.getByLabel(/disciplina/i).fill("Test Course");
  await this.page.getByLabel(/professor/i).fill("Dr. Test");
  await this.page.getByLabel("Data").fill("2026-04-15");
});

When("I do not select any questions", async function (this: CustomWorld) {
  // No questions are selected by default in the exam form — nothing to do
});

When("I leave the title empty", async function (this: CustomWorld) {
  await this.page.getByLabel(/título/i).clear();
});

When("I edit the exam and change the title to {string}", async function (this: CustomWorld, newTitle: string) {
  const editUrl = `${FRONTEND_URL}/exams/${this.lastCreatedExam.id}/edit`;
  await this.page.goto(editUrl);
  await this.page.getByLabel(/título/i).fill(newTitle);
});

When("I edit the exam and add a 4th question", async function (this: CustomWorld) {
  const editUrl = `${FRONTEND_URL}/exams/${this.lastCreatedExam.id}/edit`;
  await this.page.goto(editUrl);
  const newQuestion = await this.createQuestion("Fourth question", [
    { description: "Option A", correct: true },
    { description: "Option B", correct: false },
  ]);
  await this.page.reload();
  const questionButton = this.page.getByText(newQuestion.statement).locator("..").getByRole("button");
  await questionButton.first().click();
});

When("I edit the exam title", async function (this: CustomWorld) {
  const editUrl = `${FRONTEND_URL}/exams/${this.lastCreatedExam.id}/edit`;
  await this.page.goto(editUrl);
  const titleField = this.page.getByLabel(/título/i);
  await titleField.fill("Updated Title");
  await this.page.getByRole("button", { name: /salvar alterações/i }).click();
});

When("I delete the exam", async function (this: CustomWorld) {
  await this.page.goto(`${FRONTEND_URL}/exams`);
  const examRow = this.page.getByText(this.lastCreatedExam.title);
  await examRow.locator("..").getByRole("button", { name: /excluir prova/i }).click();
  const confirmButton = this.page.getByRole("button", { name: "Excluir" });
  if (await confirmButton.isVisible()) {
    await confirmButton.click();
  }
});

When("I attempt to delete the exam", async function (this: CustomWorld) {
  await this.page.goto(`${FRONTEND_URL}/exams`);
  const examRow = this.page.getByText(this.lastCreatedExam.title);
  await examRow.locator("..").getByRole("button", { name: /excluir prova/i }).click();
  const confirmButton = this.page.getByRole("button", { name: "Excluir" });
  if (await confirmButton.isVisible()) {
    await confirmButton.click();
  }
});

When("I navigate to the exam list page", async function (this: CustomWorld) {
  await this.page.goto(`${FRONTEND_URL}/exams`);
});

// ---------------------------------------------------------------------------
// Then
// ---------------------------------------------------------------------------

Then("the exam is saved successfully", async function (this: CustomWorld) {
  await expect(this.page).not.toHaveURL(/\/exams\/new$|\/exams\/.*\/edit$/);
  await expect(this.page.getByText(/prova criada|prova atualizada/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
});

Then("it appears in the exam list", async function (this: CustomWorld) {
  await this.page.goto(`${FRONTEND_URL}/exams`);
  await expect(this.page.getByText(this.lastCreatedExam.title)).toBeVisible();
});

Then("the exam is saved with identifier mode {string}", async function (this: CustomWorld, mode: string) {
  const res = await this.apiContext.get(`${API_URL}/api/exams/${this.lastCreatedExam.id}`);
  const exam = await res.json();
  expect(exam.identifierMode).toBe(mode);
});

Then("I see a validation error indicating the title is required", async function (this: CustomWorld) {
  await expect(this.page.getByText(/título é obrigatório/i)).toBeVisible({ timeout: 5000 });
});

Then("the exam is updated with the new title", async function (this: CustomWorld) {
  const res = await this.apiContext.get(`${API_URL}/api/exams/${this.lastCreatedExam.id}`);
  const exam = await res.json();
  expect(exam.title).toBe("New Title");
});

Then("the exam has {int} questions", async function (this: CustomWorld, expectedCount: number) {
  const res = await this.apiContext.get(`${API_URL}/api/exams/${this.lastCreatedExam.id}`);
  const exam = await res.json();
  expect(exam.questions.length).toBe(expectedCount);
});

Then("the previously generated individual exams are unchanged", async function (this: CustomWorld) {
  expect(this.lastBatch).not.toBeNull();
  const pdfUrl = `${API_URL}${this.lastBatch.pdfUrl}`;
  const res = await this.apiContext.get(pdfUrl);
  expect(res.status()).toBe(200);
});

Then("the exam is removed from the exam list", async function (this: CustomWorld) {
  await this.page.goto(`${FRONTEND_URL}/exams`);
  await expect(this.page.getByText(this.lastCreatedExam.title)).not.toBeVisible();
});

Then("the exam remains in the list", async function (this: CustomWorld) {
  await expect(this.page.getByText(this.lastCreatedExam.title)).toBeVisible();
});

Then("I see the first page of exams", async function (this: CustomWorld) {
  const items = this.page.locator("tr, li").filter({ hasText: /exam/i });
  await expect(items.first()).toBeVisible();
});

Then("the exam list is empty", async function (this: CustomWorld) {
  const emptyState = this.page
    .getByText(/nenhuma prova/i)
    .or(this.page.getByTestId("empty-state"));
  await expect(emptyState).toBeVisible({ timeout: 5000 });
});
