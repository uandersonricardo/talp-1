import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node-cron");
vi.mock("../src/services/storage");
vi.mock("../src/services/email");

import cron from "node-cron";
import * as email from "../src/services/email";
import * as storage from "../src/services/storage";
import { runDigest, startDailyDigest } from "../src/services/dailyDigest";

const TODAY = "2026-04-16";
const YESTERDAY = "2026-04-15";

const STUDENT_A = { id: "s-1", name: "Alice", cpf: "111.111.111-11", email: "alice@example.com" };

const ENTRY_YESTERDAY = {
  studentId: "s-1",
  date: YESTERDAY,
  updates: [{ classId: "cls-1", goalId: "g-1", grade: "MA" as const }],
  sent: false,
};
const ENTRY_TODAY = {
  studentId: "s-1",
  date: TODAY,
  updates: [{ classId: "cls-1", goalId: "g-1", grade: "MPA" as const }],
  sent: false,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${TODAY}T08:00:00.000Z`));
  vi.resetAllMocks();

  vi.mocked(storage.readStudents).mockReturnValue([STUDENT_A]);
  vi.mocked(storage.readClasses).mockReturnValue([]);
  vi.mocked(storage.readGoals).mockReturnValue([]);
  vi.mocked(storage.writeEmailQueue).mockReturnValue(undefined);
  vi.mocked(email.sendDigestEmail).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── startDailyDigest ──────────────────────────────────────────────────────

describe("startDailyDigest", () => {
  it("schedules a cron at 07:00 America/Sao_Paulo", () => {
    startDailyDigest();

    expect(cron.schedule).toHaveBeenCalledWith("0 7 * * *", expect.any(Function), {
      timezone: "America/Sao_Paulo",
    });
  });
});

// ─── runDigest ─────────────────────────────────────────────────────────────

describe("runDigest", () => {
  it("calls sendDigestEmail for entries with date < today", async () => {
    vi.mocked(storage.readEmailQueue).mockReturnValue([ENTRY_YESTERDAY]);

    await runDigest();

    expect(email.sendDigestEmail).toHaveBeenCalledOnce();
    expect(email.sendDigestEmail).toHaveBeenCalledWith(STUDENT_A, ENTRY_YESTERDAY.updates, YESTERDAY, [], []);
  });

  it("skips entries with date equal to today", async () => {
    vi.mocked(storage.readEmailQueue).mockReturnValue([ENTRY_TODAY]);

    await runDigest();

    expect(email.sendDigestEmail).not.toHaveBeenCalled();
  });

  it("skips entries with date in the future", async () => {
    const futureEntry = { ...ENTRY_TODAY, date: "2026-04-20" };
    vi.mocked(storage.readEmailQueue).mockReturnValue([futureEntry]);

    await runDigest();

    expect(email.sendDigestEmail).not.toHaveBeenCalled();
  });

  it("removes successfully sent entries from the queue", async () => {
    vi.mocked(storage.readEmailQueue).mockReturnValue([ENTRY_YESTERDAY]);

    await runDigest();

    const written = vi.mocked(storage.writeEmailQueue).mock.calls[0][0];
    expect(written).toHaveLength(0);
  });

  it("keeps today's entries in the queue", async () => {
    vi.mocked(storage.readEmailQueue).mockReturnValue([ENTRY_YESTERDAY, ENTRY_TODAY]);

    await runDigest();

    const written = vi.mocked(storage.writeEmailQueue).mock.calls[0][0];
    expect(written).toHaveLength(1);
    expect(written[0]).toEqual(ENTRY_TODAY);
  });

  it("keeps entries in the queue when send fails", async () => {
    vi.mocked(storage.readEmailQueue).mockReturnValue([ENTRY_YESTERDAY]);
    vi.mocked(email.sendDigestEmail).mockRejectedValue(new Error("SMTP error"));

    await runDigest();

    const written = vi.mocked(storage.writeEmailQueue).mock.calls[0][0];
    expect(written).toHaveLength(1);
    expect(written[0]).toEqual(ENTRY_YESTERDAY);
  });

  it("discards entries for unknown students", async () => {
    vi.mocked(storage.readStudents).mockReturnValue([]); // no students
    vi.mocked(storage.readEmailQueue).mockReturnValue([ENTRY_YESTERDAY]);

    await runDigest();

    expect(email.sendDigestEmail).not.toHaveBeenCalled();
    const written = vi.mocked(storage.writeEmailQueue).mock.calls[0][0];
    expect(written).toHaveLength(0);
  });

  it("processes multiple entries independently", async () => {
    const STUDENT_B = { id: "s-2", name: "Bob", cpf: "222.222.222-22", email: "bob@example.com" };
    const entryB = { studentId: "s-2", date: YESTERDAY, updates: [{ classId: "cls-1", goalId: "g-2", grade: "MPA" as const }], sent: false };

    vi.mocked(storage.readStudents).mockReturnValue([STUDENT_A, STUDENT_B]);
    vi.mocked(storage.readEmailQueue).mockReturnValue([ENTRY_YESTERDAY, entryB]);

    await runDigest();

    expect(email.sendDigestEmail).toHaveBeenCalledTimes(2);
    const written = vi.mocked(storage.writeEmailQueue).mock.calls[0][0];
    expect(written).toHaveLength(0);
  });

  it("still persists the queue even when it has no pending entries", async () => {
    vi.mocked(storage.readEmailQueue).mockReturnValue([]);

    await runDigest();

    expect(storage.writeEmailQueue).toHaveBeenCalledWith([]);
  });
});
