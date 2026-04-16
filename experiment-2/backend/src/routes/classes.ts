import { randomUUID } from "crypto";
import { Router } from "express";

import { enqueue } from "../services/emailQueue";
import { readClasses, readEvaluations, writeClasses, writeEvaluations } from "../services/storage";
import type { Grade } from "../types";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ data: readClasses() });
});

router.post("/", (req, res) => {
  const { description, year, semester } = req.body as { description: unknown; year: unknown; semester: unknown };

  if (typeof description !== "string" || !description.trim()) {
    res.status(400).json({ error: "description is required" });
    return;
  }
  if (typeof year !== "number" || !Number.isInteger(year)) {
    res.status(400).json({ error: "year must be an integer" });
    return;
  }
  if (semester !== 1 && semester !== 2) {
    res.status(400).json({ error: "semester must be 1 or 2" });
    return;
  }

  const classes = readClasses();
  const newClass: import("../types").Class = {
    id: randomUUID(),
    description: description.trim(),
    year,
    semester,
    studentIds: [],
  };
  classes.push(newClass);
  writeClasses(classes);
  res.status(201).json({ data: newClass });
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { description, year, semester } = req.body as { description: unknown; year: unknown; semester: unknown };

  const classes = readClasses();
  const index = classes.findIndex((c) => c.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  if (typeof description !== "string" || !description.trim()) {
    res.status(400).json({ error: "description is required" });
    return;
  }
  if (typeof year !== "number" || !Number.isInteger(year)) {
    res.status(400).json({ error: "year must be an integer" });
    return;
  }
  if (semester !== 1 && semester !== 2) {
    res.status(400).json({ error: "semester must be 1 or 2" });
    return;
  }

  const updated = { ...classes[index], description: description.trim(), year, semester: semester as 1 | 2 };
  classes[index] = updated;
  writeClasses(classes);
  res.json({ data: updated });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const classes = readClasses();
  const index = classes.findIndex((c) => c.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  const [deleted] = classes.splice(index, 1);
  writeClasses(classes);
  res.json({ data: deleted });
});

router.post("/:id/students/:studentId", (req, res) => {
  const { id, studentId } = req.params;
  const classes = readClasses();
  const index = classes.findIndex((c) => c.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  if (classes[index].studentIds.includes(studentId)) {
    res.status(409).json({ error: "Student already enrolled" });
    return;
  }

  classes[index] = { ...classes[index], studentIds: [...classes[index].studentIds, studentId] };
  writeClasses(classes);
  res.json({ data: classes[index] });
});

router.delete("/:id/students/:studentId", (req, res) => {
  const { id, studentId } = req.params;
  const classes = readClasses();
  const index = classes.findIndex((c) => c.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  if (!classes[index].studentIds.includes(studentId)) {
    res.status(404).json({ error: "Student not enrolled in this class" });
    return;
  }

  classes[index] = { ...classes[index], studentIds: classes[index].studentIds.filter((sid) => sid !== studentId) };
  writeClasses(classes);
  res.json({ data: classes[index] });
});

const VALID_GRADES = new Set<string>(["MANA", "MPA", "MA"]);

router.get("/:classId/evaluations", (req, res) => {
  const { classId } = req.params;
  const evaluations = readEvaluations().filter((e) => e.classId === classId);
  res.json({ data: evaluations });
});

router.put("/:classId/evaluations", (req, res) => {
  const { classId } = req.params;
  const { studentId, goalId, grade } = req.body as { studentId: unknown; goalId: unknown; grade: unknown };

  const classes = readClasses();
  if (!classes.some((c) => c.id === classId)) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  if (typeof studentId !== "string" || !studentId.trim()) {
    res.status(400).json({ error: "studentId is required" });
    return;
  }
  if (typeof goalId !== "string" || !goalId.trim()) {
    res.status(400).json({ error: "goalId is required" });
    return;
  }
  if (!VALID_GRADES.has(grade as string)) {
    res.status(400).json({ error: "grade must be MANA, MPA, or MA" });
    return;
  }

  const sid = studentId.trim();
  const gid = goalId.trim();
  const g = grade as Grade;

  const evaluations = readEvaluations();
  const index = evaluations.findIndex((e) => e.classId === classId && e.studentId === sid && e.goalId === gid);
  const updatedAt = new Date().toISOString();

  if (index === -1) {
    const evaluation = { id: randomUUID(), classId, studentId: sid, goalId: gid, grade: g, updatedAt };
    evaluations.push(evaluation);
    writeEvaluations(evaluations);
    enqueue(sid, classId, gid, g);
    res.status(201).json({ data: evaluation });
  } else {
    evaluations[index] = { ...evaluations[index], grade: g, updatedAt };
    writeEvaluations(evaluations);
    enqueue(sid, classId, gid, g);
    res.json({ data: evaluations[index] });
  }
});

export default router;

