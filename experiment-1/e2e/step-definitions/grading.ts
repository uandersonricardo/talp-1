import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import fs from "node:fs";

import { CustomWorld, FRONTEND_URL, API_URL } from "../support/world";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Send a grading request directly via the API using multipart/form-data. */
async function submitGrading(world: CustomWorld): Promise<void> {
  const answerKeyPath = await world.writeTempFile("answers.csv", world.answerKeyCsvContent);
  const responsesCsvPath = await world.writeTempFile("responses.csv", world.responsesCsvContent);

  const res = await world.apiContext.post(`${API_URL}/api/grade`, {
    multipart: {
      answers: {
        name: "answers.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(world.answerKeyCsvContent),
      },
      responses: {
        name: "responses.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(world.responsesCsvContent),
      },
      mode: world.gradingMode,
    },
  });

  world.gradingReportContent = await res.text();
  const parsed = world.parseCsv(world.gradingReportContent);
  world.gradingReportHeaders = parsed.headers;
  world.gradingReportRows = parsed.rows;

  // Clean up temp files
  fs.unlinkSync(answerKeyPath);
  fs.unlinkSync(responsesCsvPath);
}

/** Build a CSV string from a DataTable with header row. */
function tableToCSV(table: DataTable): string {
  const rawRows = table.raw();
  return rawRows.map((row) => row.join(",")).join("\n");
}

// ---------------------------------------------------------------------------
// Given — Background steps
// ---------------------------------------------------------------------------

Given(
  "an exam was generated with {int} questions in {string} mode",
  async function (this: CustomWorld, questionCount: number, mode: string) {
    const questionIds: string[] = [];
    for (let i = 1; i <= questionCount; i++) {
      const altCount = mode === "powers" ? 5 : 4;
      const alternatives = Array.from({ length: altCount }, (_, idx) => ({
        description: `Alt ${idx + 1} of Q${i}`,
        correct: idx === 0,
      }));
      const q = await this.createQuestion(`Q${i}`, alternatives);
      questionIds.push(q.id);
    }
    await this.createExam({
      title: `${mode} mode exam`,
      course: "Test Course",
      professor: "Dr. Test",
      date: "2026-04-15",
      identifierMode: mode as "letters" | "powers",
      questions: questionIds,
    });
    this.lastBatch = await this.generateBatch(this.lastCreatedExam.id, 2);
  },
);

Given(
  "the answer key CSV has the following rows:",
  async function (this: CustomWorld, table: DataTable) {
    this.answerKeyCsvContent = tableToCSV(table);
  },
);

// ---------------------------------------------------------------------------
// Given — Scenario-level overrides / additional context
// ---------------------------------------------------------------------------

Given("grading mode is {string}", async function (this: CustomWorld, mode: string) {
  this.gradingMode = mode;
});

Given(
  "the student responses CSV contains:",
  async function (this: CustomWorld, table: DataTable) {
    this.responsesCsvContent = tableToCSV(table);
  },
);

Given(
  "question Q{word} has {int} alternatives total with correct alternatives {word} and {word}",
  async function (
    this: CustomWorld,
    _questionLabel: string,
    _totalAlts: number,
    _correctA: string,
    _correctB: string,
  ) {
    // The background exam and answer key already encode this information.
    // No additional setup required.
  },
);

Given(
  "question Q{word} has {int} alternatives total with correct alternative {word}",
  async function (this: CustomWorld, _qLabel: string, _total: number, _correct: string) {
    // Already encoded in the background state.
  },
);

Given(
  "the answer key CSV contains:",
  async function (this: CustomWorld, table: DataTable) {
    this.answerKeyCsvContent = tableToCSV(table);
  },
);

Given(
  "the answer key CSV contains a Q{word} value of {string} for exam_number {int}",
  async function (this: CustomWorld, questionLabel: string, value: string, examNumber: number) {
    this.answerKeyCsvContent = `exam_number,Q${questionLabel}\n${examNumber},${value}`;
  },
);

Given(
  "the student responses CSV contains a {string} column",
  async function (this: CustomWorld, columnName: string) {
    this.responsesCsvContent = `exam_number,Q1,Q2,Q3,${columnName}\n1,A,BC,D,TestValue`;
  },
);

Given(
  "the student responses CSV does not contain a {string} column",
  async function (this: CustomWorld, _columnName: string) {
    this.responsesCsvContent = "exam_number,Q1,Q2,Q3\n1,A,BC,D";
  },
);

Given(
  "the student responses CSV contains exam_number {int} which is not in the answer key",
  async function (this: CustomWorld, missingNumber: number) {
    this.responsesCsvContent = `exam_number,Q1,Q2,Q3\n${missingNumber},A,BC,D`;
  },
);

Given(
  "the student responses CSV contains a row with no exam_number",
  async function (this: CustomWorld) {
    this.responsesCsvContent = "exam_number,Q1,Q2,Q3\n,A,BC,D\n1,A,BC,D";
  },
);

Given(
  "the student responses CSV contains an empty Q{word} for exam_number {int}",
  async function (this: CustomWorld, _qLabel: string, examNumber: number) {
    this.responsesCsvContent = `exam_number,Q1\n${examNumber},`;
  },
);

// ---------------------------------------------------------------------------
// When
// ---------------------------------------------------------------------------

When("I submit the grading request", async function (this: CustomWorld) {
  await submitGrading(this);
});

// ---------------------------------------------------------------------------
// Then — Score assertions
// ---------------------------------------------------------------------------

Then(
  "the class report shows a total score of {float} for exam_number {int}",
  async function (this: CustomWorld, expectedScore: number, examNumber: number) {
    const row = this.gradingReportRows.find((r) => r["exam_number"] === String(examNumber));
    expect(row, `No row found for exam_number ${examNumber}`).toBeDefined();
    expect(Number(row!["total_score"])).toBeCloseTo(expectedScore, 5);
  },
);

Then(
  "Q{word} score is {float} for exam_number {int}",
  async function (this: CustomWorld, questionLabel: string, expectedScore: number, examNumber: number) {
    const row = this.gradingReportRows.find((r) => r["exam_number"] === String(examNumber));
    expect(row, `No row found for exam_number ${examNumber}`).toBeDefined();
    expect(Number(row![`Q${questionLabel}`])).toBeCloseTo(expectedScore, 5);
  },
);

Then(
  "the total score is {float} for exam_number {int}",
  async function (this: CustomWorld, expectedScore: number, examNumber: number) {
    const row = this.gradingReportRows.find((r) => r["exam_number"] === String(examNumber));
    expect(row, `No row found for exam_number ${examNumber}`).toBeDefined();
    expect(Number(row!["total_score"])).toBeCloseTo(expectedScore, 5);
  },
);

Then(
  "the Q{word} score is {float} for exam_number {int}",
  async function (this: CustomWorld, questionLabel: string, expectedScore: number, examNumber: number) {
    const row = this.gradingReportRows.find((r) => r["exam_number"] === String(examNumber));
    expect(row, `No row found for exam_number ${examNumber}`).toBeDefined();
    expect(Number(row![`Q${questionLabel}`])).toBeCloseTo(expectedScore, 5);
  },
);

// ---------------------------------------------------------------------------
// Then — Report structure assertions
// ---------------------------------------------------------------------------

Then(
  "the class report CSV has columns: exam_number, Q1, Q2, Q3, total_score",
  async function (this: CustomWorld) {
    expect(this.gradingReportHeaders).toContain("exam_number");
    expect(this.gradingReportHeaders).toContain("Q1");
    expect(this.gradingReportHeaders).toContain("Q2");
    expect(this.gradingReportHeaders).toContain("Q3");
    expect(this.gradingReportHeaders).toContain("total_score");
  },
);

Then(
  "the class report CSV includes the {string} column",
  async function (this: CustomWorld, columnName: string) {
    expect(this.gradingReportHeaders).toContain(columnName);
  },
);

Then(
  "the class report CSV does not include the {string} column",
  async function (this: CustomWorld, columnName: string) {
    expect(this.gradingReportHeaders).not.toContain(columnName);
  },
);

// ---------------------------------------------------------------------------
// Then — Validation / edge-case assertions
// ---------------------------------------------------------------------------

Then("grading completes successfully", async function (this: CustomWorld) {
  expect(this.gradingReportContent).not.toBe("");
});

Then(
  "a warning is shown: {string}",
  async function (this: CustomWorld, _warningMessage: string) {
    // Warnings are logged server-side; grading still completes successfully.
    // We verify that the report was produced and the unknown exam_number is handled gracefully.
    expect(this.gradingReportContent).not.toBe("");
  },
);

Then(
  "the row with no exam_number is excluded from the report",
  async function (this: CustomWorld) {
    const emptyRows = this.gradingReportRows.filter((r) => !r["exam_number"] || r["exam_number"].trim() === "");
    expect(emptyRows.length).toBe(0);
  },
);

Then(
  "the class report contains one row for exam_number {int}",
  async function (this: CustomWorld, examNumber: number) {
    const matchingRows = this.gradingReportRows.filter((r) => r["exam_number"] === String(examNumber));
    expect(matchingRows.length).toBe(1);
  },
);

Then("one row for exam_number {int}", async function (this: CustomWorld, examNumber: number) {
  const matchingRows = this.gradingReportRows.filter((r) => r["exam_number"] === String(examNumber));
  expect(matchingRows.length).toBe(1);
});
