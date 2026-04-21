import nodemailer from "nodemailer";

import type { Class, Goal, Grade, Student } from "../types";

const GRADE_LABELS: Record<Grade, string> = {
  MANA: "Meta Ainda Não Atingida",
  MPA: "Meta Parcialmente Atingida",
  MA: "Meta Atingida",
};

// ─── In-memory capture for tests ─────────────────────────────────────────────
// Every call to sendDigestEmail appends here regardless of SMTP config, so
// test-only routes can inspect what would have been sent.

const capturedEmails: Array<{ to: string; subject: string; text: string }> = [];

export function getCapturedEmails(): Array<{ to: string; subject: string; text: string }> {
  return [...capturedEmails];
}

export function clearCapturedEmails(): void {
  capturedEmails.length = 0;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function logSmtpWarning(): void {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    console.warn("[email] SMTP not fully configured — email sending is disabled. Queue will still accumulate.");
  }
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function buildEmailBody(
  student: Student,
  updates: Array<{ classId: string; goalId: string; grade: Grade }>,
  date: string,
  classes: Class[],
  goals: Goal[],
): string {
  const lines: string[] = [
    `Olá, ${student.name}!`,
    "",
    `Suas avaliações foram atualizadas em ${formatDate(date)}:`,
    "",
  ];

  // Group by class, keeping only the latest grade per (classId, goalId) pair.
  const byClass = new Map<string, Map<string, Grade>>();
  for (const u of updates) {
    const classGoals = byClass.get(u.classId) ?? new Map<string, Grade>();
    classGoals.set(u.goalId, u.grade); // last write wins
    byClass.set(u.classId, classGoals);
  }

  for (const [classId, classGoals] of byClass) {
    const cls = classes.find((c) => c.id === classId);
    lines.push(`Turma: ${cls?.description ?? classId}`);
    for (const [goalId, grade] of classGoals) {
      const goal = goals.find((g) => g.id === goalId);
      lines.push(`  - ${goal?.name ?? goalId}: ${GRADE_LABELS[grade]}`);
    }
    lines.push("");
  }

  lines.push("Atenciosamente,");
  lines.push("Sistema de Avaliações");
  return lines.join("\n");
}

export async function sendDigestEmail(
  student: Student,
  updates: Array<{ classId: string; goalId: string; grade: Grade }>,
  date: string,
  classes: Class[],
  goals: Goal[],
): Promise<void> {
  const subject = `Avaliações atualizadas — ${formatDate(date)}`;
  const text = buildEmailBody(student, updates, date, classes, goals);

  // Always capture so tests can inspect sent emails without a real SMTP server.
  capturedEmails.push({ to: student.email, subject, text });

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) return;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({ from: SMTP_FROM, to: student.email, subject, text });
}
