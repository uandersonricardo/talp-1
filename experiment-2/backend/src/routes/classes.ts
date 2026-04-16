import { randomUUID } from "crypto";
import { Router } from "express";

import { readClasses, writeClasses } from "../services/storage";

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

export default router;
