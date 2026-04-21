import cron from "node-cron";

import { sendDigestEmail } from "./email";
import { readClasses, readEmailQueue, readGoals, readStudents, writeEmailQueue } from "./storage";

export function startDailyDigest(): void {
  cron.schedule("0 7 * * *", () => void runDigest(), { timezone: "America/Sao_Paulo" });
}

export async function runDigest(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await runDigestAt(today);
}

// runDigestAt processes all queue entries whose date is strictly before asOfDate.
// Pass a future date (e.g. tomorrow) to process today's entries — used by test routes.
export async function runDigestAt(asOfDate: string): Promise<void> {
  const queue = readEmailQueue();
  const students = readStudents();
  const classes = readClasses();
  const goals = readGoals();

  const remaining: typeof queue = [];

  for (const entry of queue) {
    if (entry.date >= asOfDate) {
      remaining.push(entry);
      continue;
    }

    const student = students.find((s) => s.id === entry.studentId);
    if (!student) continue; // unknown student — discard silently

    try {
      await sendDigestEmail(student, entry.updates, entry.date, classes, goals);
      // successfully sent — omit from remaining (removes from queue)
    } catch (err) {
      console.error(`[dailyDigest] Failed to send email for student ${entry.studentId}:`, err);
      remaining.push(entry); // keep for retry
    }
  }

  writeEmailQueue(remaining);
}
