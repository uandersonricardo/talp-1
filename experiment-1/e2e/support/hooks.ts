import { Before, After } from "@cucumber/cucumber";
import { chromium, request as playwrightRequest } from "playwright";
import { spawn } from "node:child_process";
import path from "node:path";

import { API_URL, CustomWorld, FRONTEND_URL } from "./world";

const BACKEND_DIR = path.resolve(__dirname, "../../backend");

function waitForServer(url: string, timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    function attempt() {
      fetch(url)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() > deadline) {
            reject(new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`));
          } else {
            setTimeout(attempt, 150);
          }
        });
    }
    attempt();
  });
}

Before(async function (this: CustomWorld) {
  this.serverProcess = spawn("node", ["-r", "ts-node/register", "src/index.ts"], {
    cwd: BACKEND_DIR,
    env: { ...process.env },
    stdio: "ignore",
  });

  await waitForServer(`${API_URL}/api/questions`);

  const headless = process.env.HEADLESS !== "false";

  this.browser = await chromium.launch({ headless });
  this.context = await this.browser.newContext({ baseURL: FRONTEND_URL });
  this.page = await this.context.newPage();

  this.apiContext = await playwrightRequest.newContext({ baseURL: API_URL });

  // Reset scenario-level state
  this.lastCreatedQuestion = null;
  this.lastCreatedExam = null;
  this.lastBatch = null;
  this.createdQuestionIds = [];
  this.createdExamIds = [];
  this.answerKeyCsvContent = "";
  this.responsesCsvContent = "";
  this.gradingMode = "strict";
  this.gradingReportContent = "";
  this.gradingReportHeaders = [];
  this.gradingReportRows = [];
});

After(async function (this: CustomWorld) {
  await this.page?.close();
  await this.context?.close();
  await this.browser?.close();
  await this.apiContext?.dispose();

  this.serverProcess?.kill();
  this.serverProcess = null;
});
