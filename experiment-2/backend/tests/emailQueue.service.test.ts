import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/services/storage");

import * as storage from "../src/services/storage";
import { enqueue } from "../src/services/emailQueue";

const TODAY = "2026-04-16";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${TODAY}T08:00:00.000Z`));
  vi.resetAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("enqueue", () => {
  it("creates a new entry when no entry exists for today", () => {
    vi.mocked(storage.readEmailQueue).mockReturnValue([]);
    vi.mocked(storage.writeEmailQueue).mockReturnValue(undefined);

    enqueue("s-1", "cls-1", "g-1", "MA");

    const written = vi.mocked(storage.writeEmailQueue).mock.calls[0][0];
    expect(written).toHaveLength(1);
    expect(written[0]).toEqual({
      studentId: "s-1",
      date: TODAY,
      updates: [{ classId: "cls-1", goalId: "g-1", grade: "MA" }],
      sent: false,
    });
  });

  it("appends to an existing unsent entry for the same student and day", () => {
    vi.mocked(storage.readEmailQueue).mockReturnValue([
      { studentId: "s-1", date: TODAY, updates: [{ classId: "cls-1", goalId: "g-1", grade: "MPA" }], sent: false },
    ]);
    vi.mocked(storage.writeEmailQueue).mockReturnValue(undefined);

    enqueue("s-1", "cls-1", "g-2", "MA");

    const written = vi.mocked(storage.writeEmailQueue).mock.calls[0][0];
    expect(written).toHaveLength(1);
    expect(written[0].updates).toHaveLength(2);
    expect(written[0].updates[1]).toEqual({ classId: "cls-1", goalId: "g-2", grade: "MA" });
  });

  it("creates a new entry when the existing entry for today is already sent", () => {
    vi.mocked(storage.readEmailQueue).mockReturnValue([
      { studentId: "s-1", date: TODAY, updates: [{ classId: "cls-1", goalId: "g-1", grade: "MPA" }], sent: true },
    ]);
    vi.mocked(storage.writeEmailQueue).mockReturnValue(undefined);

    enqueue("s-1", "cls-1", "g-1", "MA");

    const written = vi.mocked(storage.writeEmailQueue).mock.calls[0][0];
    expect(written).toHaveLength(2);
    expect(written[1]).toEqual({
      studentId: "s-1",
      date: TODAY,
      updates: [{ classId: "cls-1", goalId: "g-1", grade: "MA" }],
      sent: false,
    });
  });

  it("does not mix entries from different students", () => {
    vi.mocked(storage.readEmailQueue).mockReturnValue([
      { studentId: "s-2", date: TODAY, updates: [{ classId: "cls-1", goalId: "g-1", grade: "MPA" }], sent: false },
    ]);
    vi.mocked(storage.writeEmailQueue).mockReturnValue(undefined);

    enqueue("s-1", "cls-1", "g-1", "MA");

    const written = vi.mocked(storage.writeEmailQueue).mock.calls[0][0];
    expect(written).toHaveLength(2);
    expect(written[1].studentId).toBe("s-1");
  });

  it("does not mix entries from different days", () => {
    vi.mocked(storage.readEmailQueue).mockReturnValue([
      { studentId: "s-1", date: "2026-04-15", updates: [{ classId: "cls-1", goalId: "g-1", grade: "MPA" }], sent: false },
    ]);
    vi.mocked(storage.writeEmailQueue).mockReturnValue(undefined);

    enqueue("s-1", "cls-1", "g-1", "MA");

    const written = vi.mocked(storage.writeEmailQueue).mock.calls[0][0];
    expect(written).toHaveLength(2);
    expect(written[1].date).toBe(TODAY);
  });
});
