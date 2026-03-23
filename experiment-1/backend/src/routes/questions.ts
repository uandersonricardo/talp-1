import { Router } from "express";
import type { Request, Response } from "express";

import {
  ServiceError,
  createQuestion,
  deleteQuestion,
  getQuestion,
  listQuestions,
  updateQuestion,
} from "../services/questionService";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 20);
  const search = req.query.search as string | undefined;
  res.json(listQuestions(search, page, limit));
});

router.post("/", (req: Request, res: Response) => {
  try {
    const { statement, alternatives } = req.body;
    const question = createQuestion(statement, alternatives);
    res.status(201).json(question);
  } catch (e) {
    if (e instanceof ServiceError) return res.status(e.statusCode).json({ error: e.message });
    throw e;
  }
});

router.get("/:id", (req: Request, res: Response) => {
  try {
    res.json(getQuestion(String(req.params.id)));
  } catch (e) {
    if (e instanceof ServiceError) return res.status(e.statusCode).json({ error: e.message });
    throw e;
  }
});

router.put("/:id", (req: Request, res: Response) => {
  try {
    const { statement, alternatives } = req.body;
    res.json(updateQuestion(String(req.params.id), statement, alternatives));
  } catch (e) {
    if (e instanceof ServiceError) return res.status(e.statusCode).json({ error: e.message });
    throw e;
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  try {
    deleteQuestion(String(req.params.id));
    res.status(204).send();
  } catch (e) {
    if (e instanceof ServiceError) return res.status(e.statusCode).json({ error: e.message });
    throw e;
  }
});

export default router;
