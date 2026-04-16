import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoist mock handles so they are available inside vi.mock factory
const { mockSendMail, mockCreateTransport } = vi.hoisted(() => ({
  mockSendMail: vi.fn().mockResolvedValue({ messageId: "test-id" }),
  mockCreateTransport: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: { createTransport: mockCreateTransport },
}));

import { buildEmailBody, formatDate, logSmtpWarning, sendDigestEmail } from "../src/services/email";

const STUDENT = { id: "s-1", name: "Alice", cpf: "111.111.111-11", email: "alice@example.com" };
const CLASSES = [{ id: "cls-1", description: "Introdução à Programação", year: 2024, semester: 1 as const, studentIds: [] }];
const GOALS = [{ id: "g-1", name: "Requisitos" }];
const UPDATES = [{ classId: "cls-1", goalId: "g-1", grade: "MA" as const }];
const DATE = "2026-04-15";

const SMTP_ENV = {
  SMTP_HOST: "smtp.example.com",
  SMTP_PORT: "587",
  SMTP_USER: "user@example.com",
  SMTP_PASS: "secret",
  SMTP_FROM: "no-reply@example.com",
};

beforeEach(() => {
  vi.resetAllMocks();
  mockCreateTransport.mockReturnValue({ sendMail: mockSendMail });
});

afterEach(() => {
  for (const key of Object.keys(SMTP_ENV)) {
    delete process.env[key];
  }
});

// ─── formatDate ────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("converts YYYY-MM-DD to DD/MM/YYYY", () => {
    expect(formatDate("2026-04-15")).toBe("15/04/2026");
  });
});

// ─── buildEmailBody ────────────────────────────────────────────────────────

describe("buildEmailBody", () => {
  it("greets the student by name", () => {
    const body = buildEmailBody(STUDENT, UPDATES, DATE, CLASSES, GOALS);
    expect(body).toContain("Olá, Alice!");
  });

  it("includes the formatted date", () => {
    const body = buildEmailBody(STUDENT, UPDATES, DATE, CLASSES, GOALS);
    expect(body).toContain("15/04/2026");
  });

  it("includes the class description", () => {
    const body = buildEmailBody(STUDENT, UPDATES, DATE, CLASSES, GOALS);
    expect(body).toContain("Introdução à Programação");
  });

  it("includes the goal name", () => {
    const body = buildEmailBody(STUDENT, UPDATES, DATE, CLASSES, GOALS);
    expect(body).toContain("Requisitos");
  });

  it("shows the full Portuguese grade label for MA", () => {
    const body = buildEmailBody(STUDENT, UPDATES, DATE, CLASSES, GOALS);
    expect(body).toContain("Meta Atingida");
  });

  it("shows the full Portuguese grade label for MPA", () => {
    const body = buildEmailBody(STUDENT, [{ classId: "cls-1", goalId: "g-1", grade: "MPA" }], DATE, CLASSES, GOALS);
    expect(body).toContain("Meta Parcialmente Atingida");
  });

  it("shows the full Portuguese grade label for MANA", () => {
    const body = buildEmailBody(STUDENT, [{ classId: "cls-1", goalId: "g-1", grade: "MANA" }], DATE, CLASSES, GOALS);
    expect(body).toContain("Meta Ainda Não Atingida");
  });

  it("falls back to classId when class is not found", () => {
    const body = buildEmailBody(STUDENT, [{ classId: "unknown-cls", goalId: "g-1", grade: "MA" }], DATE, [], GOALS);
    expect(body).toContain("unknown-cls");
  });

  it("falls back to goalId when goal is not found", () => {
    const body = buildEmailBody(STUDENT, [{ classId: "cls-1", goalId: "unknown-goal", grade: "MA" }], DATE, CLASSES, []);
    expect(body).toContain("unknown-goal");
  });

  it("groups multiple updates under the same class", () => {
    const updates = [
      { classId: "cls-1", goalId: "g-1", grade: "MA" as const },
      { classId: "cls-1", goalId: "g-2", grade: "MPA" as const },
    ];
    const goals = [...GOALS, { id: "g-2", name: "Testes" }];
    const body = buildEmailBody(STUDENT, updates, DATE, CLASSES, goals);
    const classOccurrences = (body.match(/Introdução à Programação/g) ?? []).length;
    expect(classOccurrences).toBe(1);
    expect(body).toContain("Requisitos");
    expect(body).toContain("Testes");
  });
});

// ─── logSmtpWarning ────────────────────────────────────────────────────────

describe("logSmtpWarning", () => {
  it("logs a warning when SMTP is not configured", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSmtpWarning();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("SMTP not fully configured"));
  });

  it("does not log when SMTP is fully configured", () => {
    Object.assign(process.env, SMTP_ENV);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSmtpWarning();
    expect(warn).not.toHaveBeenCalled();
  });
});

// ─── sendDigestEmail ───────────────────────────────────────────────────────

describe("sendDigestEmail", () => {
  it("sends an email when SMTP is configured", async () => {
    Object.assign(process.env, SMTP_ENV);

    await sendDigestEmail(STUDENT, UPDATES, DATE, CLASSES, GOALS);

    expect(mockCreateTransport).toHaveBeenCalledOnce();
    expect(mockSendMail).toHaveBeenCalledOnce();
  });

  it("sends to the student's email address", async () => {
    Object.assign(process.env, SMTP_ENV);

    await sendDigestEmail(STUDENT, UPDATES, DATE, CLASSES, GOALS);

    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({ to: STUDENT.email }));
  });

  it("uses correct subject with formatted date", async () => {
    Object.assign(process.env, SMTP_ENV);

    await sendDigestEmail(STUDENT, UPDATES, DATE, CLASSES, GOALS);

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Avaliações atualizadas — 15/04/2026" }),
    );
  });

  it("skips sending when SMTP is not configured", async () => {
    await sendDigestEmail(STUDENT, UPDATES, DATE, CLASSES, GOALS);

    expect(mockCreateTransport).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("creates the transporter with SMTP credentials", async () => {
    Object.assign(process.env, SMTP_ENV);

    await sendDigestEmail(STUDENT, UPDATES, DATE, CLASSES, GOALS);

    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: SMTP_ENV.SMTP_HOST,
      port: Number(SMTP_ENV.SMTP_PORT),
      auth: { user: SMTP_ENV.SMTP_USER, pass: SMTP_ENV.SMTP_PASS },
    });
  });
});
