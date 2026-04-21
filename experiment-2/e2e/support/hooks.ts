import { After, AfterAll, Before, BeforeAll } from "@cucumber/cucumber";
import { chromium, type Browser } from "playwright";
import { FRONTEND_URL, startServers, stopServers } from "./server";
import { World } from "./world";

let browser: Browser;

// Start backend + frontend and launch the browser once for the entire suite.
// The 60-second timeout covers the initial TypeScript compilation by ts-node.
BeforeAll({ timeout: 60_000 }, async function () {
  await startServers();
  browser = await chromium.launch({ headless: process.env.HEADLESS !== "false" });
});

AfterAll(async function () {
  await browser?.close();
  stopServers();
});

// Each scenario gets a fresh browser context with a 1280×720 desktop viewport
// (≥ lg breakpoint) so the sidebar is visible. Student data is wiped via the
// API before every scenario so each test starts from a known empty state.
Before(async function (this: World) {
  this.context = await browser.newContext({
    baseURL: FRONTEND_URL,
    viewport: { width: 1280, height: 720 },
  });
  this.page = await this.context.newPage();
  await this.cleanStudents();
});

After(async function (this: World) {
  await this.context?.close();
});
