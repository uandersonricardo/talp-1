import { randomUUID } from "crypto";
import { Router } from "express";

import { readGoals, writeGoals } from "../services/storage";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ data: readGoals() });
});

router.post("/", (req, res) => {
  const { name } = req.body as { name: unknown };

  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const goals = readGoals();
  const goal = { id: randomUUID(), name: name.trim() };
  goals.push(goal);
  writeGoals(goals);
  res.status(201).json({ data: goal });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const goals = readGoals();
  const index = goals.findIndex((g) => g.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  const [deleted] = goals.splice(index, 1);
  writeGoals(goals);
  res.json({ data: deleted });
});

export default router;
