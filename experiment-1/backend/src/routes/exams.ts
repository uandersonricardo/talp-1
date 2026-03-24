import { Router } from "express";
import type { Request, Response } from "express";

import { createExam, deleteExam, getExam, listExams, updateExam } from "../services/examService";
import { ServiceError } from "../services/questionService";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 20);
  const search = req.query.search as string | undefined;
  res.json(listExams(search, page, limit));
});

router.post("/", (req: Request, res: Response) => {
  try {
    const { title, course, professor, date, identifierMode, questions } = req.body;
    res.status(201).json(createExam(title, course, professor, date, identifierMode, questions));
  } catch (e) {
    if (e instanceof ServiceError) return res.status(e.statusCode).json({ error: e.message });
    throw e;
  }
});

router.get("/:id", (req: Request, res: Response) => {
  try {
    res.json(getExam(String(req.params.id)));
  } catch (e) {
    if (e instanceof ServiceError) return res.status(e.statusCode).json({ error: e.message });
    throw e;
  }
});

router.put("/:id", (req: Request, res: Response) => {
  try {
    const { title, course, professor, date, identifierMode, questions } = req.body;
    res.json(updateExam(String(req.params.id), title, course, professor, date, identifierMode, questions));
  } catch (e) {
    if (e instanceof ServiceError) return res.status(e.statusCode).json({ error: e.message });
    throw e;
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  try {
    deleteExam(String(req.params.id));
    res.status(204).send();
  } catch (e) {
    if (e instanceof ServiceError) return res.status(e.statusCode).json({ error: e.message });
    throw e;
  }
});

export default router;
