import type { Grade } from "../types";
import { readEmailQueue, writeEmailQueue } from "./storage";

function localDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function enqueue(studentId: string, classId: string, goalId: string, grade: Grade): void {
  const today = localDateString();
  const queue = readEmailQueue();

  const index = queue.findIndex((e) => e.studentId === studentId && e.date === today);

  if (index === -1 || queue[index].sent) {
    queue.push({ studentId, date: today, updates: [{ classId, goalId, grade }], sent: false });
  } else {
    queue[index].updates.push({ classId, goalId, grade });
  }

  writeEmailQueue(queue);
}
