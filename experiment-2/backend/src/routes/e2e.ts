import { Router } from "express";

import { runDigestAt } from "../services/dailyDigest";
import { clearCapturedEmails, getCapturedEmails } from "../services/email";
import { readEmailQueue, writeEmailQueue } from "../services/storage";

const router = Router();

// ─── Email queue ──────────────────────────────────────────────────────────────

router.get("/email-queue", (_req, res) => {
  res.json({ data: readEmailQueue() });
});

router.delete("/email-queue", (_req, res) => {
  writeEmailQueue([]);
  res.json({ data: [] });
});

// ─── Captured (would-be-sent) emails ─────────────────────────────────────────

router.get("/sent-emails", (_req, res) => {
  res.json({ data: getCapturedEmails() });
});

router.delete("/sent-emails", (_req, res) => {
  clearCapturedEmails();
  res.json({ data: [] });
});

// ─── Digest trigger ───────────────────────────────────────────────────────────
// Accept an explicit asOfDate so tests can process today's entries by passing
// tomorrow's date (the real cron always uses the current day).

router.post("/run-digest", async (req, res) => {
  const { asOfDate } = req.body as { asOfDate?: string };
  const date = asOfDate ?? offsetDate(1);
  try {
    await runDigestAt(date);
    res.json({ data: { ok: true, asOfDate: date } });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default router;
