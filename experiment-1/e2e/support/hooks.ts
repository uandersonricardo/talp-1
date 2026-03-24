import { Before, After } from "@cucumber/cucumber";
import { chromium, request as playwrightRequest } from "playwright";

import { CustomWorld, FRONTEND_URL, API_URL } from "./world";

Before(async function (this: CustomWorld) {
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
});
