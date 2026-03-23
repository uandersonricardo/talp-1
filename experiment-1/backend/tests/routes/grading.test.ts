import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import { app } from "../../src/index";
import { resetDb } from "../../src/db";

beforeEach(() => resetDb());

// --- Helpers ---

async function createQuestion(alts = [{ description: "Yes", correct: true }, { description: "No", correct: false }]) {
  const res = await request(app).post("/api/questions").send({
    statement: "Sample question?",
    alternatives: alts,
  });
  return res.body.id as string;
}

async function createExam(questionIds: string[], identifierMode: "letters" | "powers" = "letters") {
  const res = await request(app).post("/api/exams").send({
    title: "Midterm",
    course: "Math 101",
    professor: "Dr. Smith",
    date: "2026-04-15",
    identifierMode,
    questions: questionIds,
  });
  return res.body.id as string;
}

async function generateBatch(examId: string, count = 2) {
  const res = await request(app).post(`/api/exams/${examId}/generate`).send({ count });
  return res.body.batchId as string;
}

async function getAnswerKeyCsv(batchId: string): Promise<string> {
  const res = await request(app).get(`/api/batches/${batchId}/answers.csv`);
  return res.text;
}

// Build responses CSV matching an answer key CSV (student submits all correct answers)
function buildPerfectResponses(answerKeyCsv: string): string {
  const lines = answerKeyCsv.trim().split("\n");
  const header = lines[0];
  // Replace header column names with generic answer column names (same count)
  const colCount = header.split(",").length - 1;
  const responseHeader = ["exam_number", ...Array.from({ length: colCount }, (_, i) => `a${i + 1}`)].join(",");
  // Use the same answer values as the key
  const dataRows = lines.slice(1).map((line) => {
    const [examNum, ...answers] = line.split(",");
    return [examNum, ...answers].join(",");
  });
  return [responseHeader, ...dataRows].join("\n");
}

// Build responses CSV where all student answers are wrong/empty
function buildEmptyResponses(answerKeyCsv: string): string {
  const lines = answerKeyCsv.trim().split("\n");
  const colCount = lines[0].split(",").length - 1;
  const responseHeader = ["exam_number", ...Array.from({ length: colCount }, (_, i) => `a${i + 1}`)].join(",");
  const dataRows = lines.slice(1).map((line) => {
    const examNum = line.split(",")[0];
    return [examNum, ...Array.from({ length: colCount }, () => "")].join(",");
  });
  return [responseHeader, ...dataRows].join("\n");
}

// --- POST /api/grade ---

describe("POST /api/grade", () => {
  it("returns 400 if answers file is missing", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const batchId = await generateBatch(examId);
    const key = await getAnswerKeyCsv(batchId);

    const res = await request(app)
      .post("/api/grade")
      .field("mode", "strict")
      .attach("responses", Buffer.from(buildPerfectResponses(key)), {
        filename: "responses.csv",
        contentType: "text/csv",
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 if responses file is missing", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const batchId = await generateBatch(examId);
    const key = await getAnswerKeyCsv(batchId);

    const res = await request(app)
      .post("/api/grade")
      .field("mode", "strict")
      .attach("answers", Buffer.from(key), { filename: "answers.csv", contentType: "text/csv" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 if mode is missing", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const batchId = await generateBatch(examId);
    const key = await getAnswerKeyCsv(batchId);
    const responses = buildPerfectResponses(key);

    const res = await request(app)
      .post("/api/grade")
      .attach("answers", Buffer.from(key), { filename: "answers.csv", contentType: "text/csv" })
      .attach("responses", Buffer.from(responses), { filename: "responses.csv", contentType: "text/csv" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 for invalid mode", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const batchId = await generateBatch(examId);
    const key = await getAnswerKeyCsv(batchId);
    const responses = buildPerfectResponses(key);

    const res = await request(app)
      .post("/api/grade")
      .field("mode", "invalid")
      .attach("answers", Buffer.from(key), { filename: "answers.csv", contentType: "text/csv" })
      .attach("responses", Buffer.from(responses), { filename: "responses.csv", contentType: "text/csv" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 200 with text/csv content-type for strict mode", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const batchId = await generateBatch(examId);
    const key = await getAnswerKeyCsv(batchId);
    const responses = buildPerfectResponses(key);

    const res = await request(app)
      .post("/api/grade")
      .field("mode", "strict")
      .attach("answers", Buffer.from(key), { filename: "answers.csv", contentType: "text/csv" })
      .attach("responses", Buffer.from(responses), { filename: "responses.csv", contentType: "text/csv" });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("attachment");
  });

  it("report has header row with exam_number, q-scores, and total_score", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const batchId = await generateBatch(examId, 1);
    const key = await getAnswerKeyCsv(batchId);
    const responses = buildPerfectResponses(key);

    const res = await request(app)
      .post("/api/grade")
      .field("mode", "strict")
      .attach("answers", Buffer.from(key), { filename: "answers.csv", contentType: "text/csv" })
      .attach("responses", Buffer.from(responses), { filename: "responses.csv", contentType: "text/csv" });

    const header = res.text.split("\n")[0];
    expect(header).toBe("exam_number,q1_score,total_score");
  });

  it("strict mode: perfect responses → score 1 per question", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const batchId = await generateBatch(examId, 2);
    const key = await getAnswerKeyCsv(batchId);
    const responses = buildPerfectResponses(key);

    const res = await request(app)
      .post("/api/grade")
      .field("mode", "strict")
      .attach("answers", Buffer.from(key), { filename: "answers.csv", contentType: "text/csv" })
      .attach("responses", Buffer.from(responses), { filename: "responses.csv", contentType: "text/csv" });

    const dataRows = res.text.split("\n").slice(1);
    expect(dataRows).toHaveLength(2);
    for (const row of dataRows) {
      const cols = row.split(",");
      expect(cols[1]).toBe("1"); // q1_score
      expect(cols[2]).toBe("1"); // total_score
    }
  });

  it("strict mode: empty responses → score 0 per question", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const batchId = await generateBatch(examId, 2);
    const key = await getAnswerKeyCsv(batchId);
    const responses = buildEmptyResponses(key);

    const res = await request(app)
      .post("/api/grade")
      .field("mode", "strict")
      .attach("answers", Buffer.from(key), { filename: "answers.csv", contentType: "text/csv" })
      .attach("responses", Buffer.from(responses), { filename: "responses.csv", contentType: "text/csv" });

    const dataRows = res.text.split("\n").slice(1);
    expect(dataRows).toHaveLength(2);
    for (const row of dataRows) {
      const cols = row.split(",");
      expect(cols[1]).toBe("0"); // q1_score
      expect(cols[2]).toBe("0"); // total_score
    }
  });

  it("lenient mode: perfect responses → score 1 per question", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId], "letters");
    const batchId = await generateBatch(examId, 1);
    const key = await getAnswerKeyCsv(batchId);
    const responses = buildPerfectResponses(key);

    const res = await request(app)
      .post("/api/grade")
      .field("mode", "lenient")
      .attach("answers", Buffer.from(key), { filename: "answers.csv", contentType: "text/csv" })
      .attach("responses", Buffer.from(responses), { filename: "responses.csv", contentType: "text/csv" });

    expect(res.status).toBe(200);
    const dataRows = res.text.split("\n").slice(1);
    expect(dataRows).toHaveLength(1);
    expect(dataRows[0].split(",")[1]).toBe("1"); // q1_score
  });

  it("lenient mode powers: perfect responses → score 1", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId], "powers");
    const batchId = await generateBatch(examId, 1);
    const key = await getAnswerKeyCsv(batchId);
    const responses = buildPerfectResponses(key);

    const res = await request(app)
      .post("/api/grade")
      .field("mode", "lenient")
      .attach("answers", Buffer.from(key), { filename: "answers.csv", contentType: "text/csv" })
      .attach("responses", Buffer.from(responses), { filename: "responses.csv", contentType: "text/csv" });

    expect(res.status).toBe(200);
    const score = res.text.split("\n")[1].split(",")[1];
    expect(Number(score)).toBe(1);
  });

  it("report includes one row per student response (matches count)", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const batchId = await generateBatch(examId, 5);
    const key = await getAnswerKeyCsv(batchId);
    const responses = buildPerfectResponses(key);

    const res = await request(app)
      .post("/api/grade")
      .field("mode", "strict")
      .attach("answers", Buffer.from(key), { filename: "answers.csv", contentType: "text/csv" })
      .attach("responses", Buffer.from(responses), { filename: "responses.csv", contentType: "text/csv" });

    const lines = res.text.trim().split("\n");
    expect(lines).toHaveLength(6); // 1 header + 5 rows
  });

  it("handles unmatched exam_number in responses without failing", async () => {
    const qId = await createQuestion();
    const examId = await createExam([qId]);
    const batchId = await generateBatch(examId, 1);
    const key = await getAnswerKeyCsv(batchId);
    // Response with an exam_number not in the key
    const responses = "exam_number,a1\n999,A";

    const res = await request(app)
      .post("/api/grade")
      .field("mode", "strict")
      .attach("answers", Buffer.from(key), { filename: "answers.csv", contentType: "text/csv" })
      .attach("responses", Buffer.from(responses), { filename: "responses.csv", contentType: "text/csv" });

    expect(res.status).toBe(200);
    const dataRow = res.text.split("\n")[1];
    expect(dataRow.startsWith("999")).toBe(true);
  });
});
