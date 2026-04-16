import fs from "fs";
import path from "path";

import type { Student } from "../types";

const DATA_DIR = path.resolve(__dirname, "../data");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readFile<T>(filename: string): T[] {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeFile<T>(filename: string, data: T[]): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function readStudents(): Student[] {
  return readFile<Student>("students.json");
}

export function writeStudents(students: Student[]): void {
  writeFile("students.json", students);
}
