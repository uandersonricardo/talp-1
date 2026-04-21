import { randomUUID } from "crypto";
import { Router } from "express";

import { readStudents, writeStudents } from "../services/storage";

const router = Router();

router.get("/", (_req, res) => {
  const students = readStudents();
  res.json({ data: students });
});

router.post("/", (req, res) => {
  const { name, cpf, email } = req.body as { name: unknown; cpf: unknown; email: unknown };

  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (typeof cpf !== "string" || !cpf.trim()) {
    res.status(400).json({ error: "cpf is required" });
    return;
  }
  if (typeof email !== "string" || !email.trim()) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const students = readStudents();

  const normalize = (s: string) => s.replace(/\D/g, "");
  const duplicate = students.find((s) => normalize(s.cpf) === normalize(cpf.trim()));
  if (duplicate) {
    res.status(409).json({ error: "CPF já cadastrado" });
    return;
  }

  const student = { id: randomUUID(), name: name.trim(), cpf: cpf.trim(), email: email.trim() };
  students.push(student);
  writeStudents(students);
  res.status(201).json({ data: student });
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, cpf, email } = req.body as { name: unknown; cpf: unknown; email: unknown };

  const students = readStudents();
  const index = students.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (typeof cpf !== "string" || !cpf.trim()) {
    res.status(400).json({ error: "cpf is required" });
    return;
  }
  if (typeof email !== "string" || !email.trim()) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const updated = { ...students[index], name: name.trim(), cpf: cpf.trim(), email: email.trim() };
  students[index] = updated;
  writeStudents(students);
  res.json({ data: updated });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const students = readStudents();
  const index = students.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const [deleted] = students.splice(index, 1);
  writeStudents(students);
  res.json({ data: deleted });
});

export default router;
