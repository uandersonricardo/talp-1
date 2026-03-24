import { World, IWorldOptions, setWorldConstructor } from "@cucumber/cucumber";
import type { Browser, BrowserContext, Page, APIRequestContext } from "playwright";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
export const API_URL = process.env.API_URL ?? "http://localhost:3000";

export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  apiContext!: APIRequestContext;

  // Domain state shared across steps
  lastCreatedQuestion: any = null;
  lastCreatedExam: any = null;
  lastBatch: any = null;
  createdQuestionIds: string[] = [];
  createdExamIds: string[] = [];

  // Grading state
  answerKeyCsvContent = "";
  responsesCsvContent = "";
  gradingMode = "strict";
  gradingReportContent = "";
  gradingReportHeaders: string[] = [];
  gradingReportRows: Record<string, string>[] = [];

  constructor(options: IWorldOptions) {
    super(options);
  }

  /** Convert a DataTable hashes array into a CSV string. */
  csvFromHashes(rows: Record<string, string>[]): string {
    if (rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const headerRow = headers.join(",");
    const dataRows = rows.map((row) => headers.map((h) => row[h] ?? "").join(","));
    return [headerRow, ...dataRows].join("\n");
  }

  /** Parse a CSV string into headers + rows. */
  parseCsv(content: string): { headers: string[]; rows: Record<string, string>[] } {
    const lines = content.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] ?? "";
      });
      return row;
    });
    return { headers, rows };
  }

  /** Write content to a temp file and return its absolute path. */
  async writeTempFile(filename: string, content: string): Promise<string> {
    const filePath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(filePath, content, "utf-8");
    return filePath;
  }

  /** Create a question via the API and store its id. */
  async createQuestion(
    statement: string,
    alternatives: Array<{ description: string; correct: boolean }>,
  ): Promise<any> {
    const res = await this.apiContext.post(`${API_URL}/api/questions`, {
      data: { statement, alternatives },
    });
    const question = await res.json();
    this.lastCreatedQuestion = question;
    this.createdQuestionIds.push(question.id);
    return question;
  }

  /** Create an exam via the API and store its id. */
  async createExam(payload: {
    title: string;
    course: string;
    professor: string;
    date: string;
    identifierMode: "letters" | "powers";
    questions: string[];
  }): Promise<any> {
    const res = await this.apiContext.post(`${API_URL}/api/exams`, { data: payload });
    const exam = await res.json();
    this.lastCreatedExam = exam;
    this.createdExamIds.push(exam.id);
    return exam;
  }

  /** Generate a batch for an exam via the API. */
  async generateBatch(examId: string, count: number): Promise<any> {
    const res = await this.apiContext.post(`${API_URL}/api/exams/${examId}/generate`, {
      data: { count },
    });
    const batch = await res.json();
    this.lastBatch = batch;
    return batch;
  }

  /** Download text content from a URL using the apiContext. */
  async downloadText(url: string): Promise<string> {
    const res = await this.apiContext.get(url);
    return res.text();
  }

  /** Download binary buffer from a URL using the apiContext. */
  async downloadBuffer(url: string): Promise<Buffer> {
    const res = await this.apiContext.get(url);
    return Buffer.from(await res.body());
  }
}

setWorldConstructor(CustomWorld);
