import nodemailer from "nodemailer";

import type { Class, Goal, Grade, Student } from "../types";

const GRADE_LABELS: Record<Grade, string> = {
  MANA: "Meta Ainda Não Atingida",
  MPA: "Meta Parcialmente Atingida",
  MA: "Meta Atingida",
};

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

  const byClass = new Map<string, Array<{ goalId: string; grade: Grade }>>();
  for (const u of updates) {
    const list = byClass.get(u.classId) ?? [];
    list.push({ goalId: u.goalId, grade: u.grade });
    byClass.set(u.classId, list);
  }

  for (const [classId, classUpdates] of byClass) {
    const cls = classes.find((c) => c.id === classId);
    lines.push(`Turma: ${cls?.description ?? classId}`);
    for (const u of classUpdates) {
      const goal = goals.find((g) => g.id === u.goalId);
      lines.push(`  - ${goal?.name ?? u.goalId}: ${GRADE_LABELS[u.grade]}`);
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
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) return;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: SMTP_FROM,
    to: student.email,
    subject: `Avaliações atualizadas — ${formatDate(date)}`,
    text: buildEmailBody(student, updates, date, classes, goals),
  });
}
