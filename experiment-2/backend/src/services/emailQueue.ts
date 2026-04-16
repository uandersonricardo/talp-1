import type { Grade } from "../types";
import { readEmailQueue, writeEmailQueue } from "./storage";

export function enqueue(studentId: string, classId: string, goalId: string, grade: Grade): void {
  const today = new Date().toISOString().slice(0, 10);
  const queue = readEmailQueue();

  const index = queue.findIndex((e) => e.studentId === studentId && e.date === today);

  if (index === -1 || queue[index].sent) {
    queue.push({ studentId, date: today, updates: [{ classId, goalId, grade }], sent: false });
  } else {
    queue[index].updates.push({ classId, goalId, grade });
  }

  writeEmailQueue(queue);
}
