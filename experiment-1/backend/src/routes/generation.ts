import { Router } from "express";
import type { Request, Response } from "express";

import { generateBatch, getExamBatches, getBatchAnswersCsv, getBatchPdf } from "../services/generationService";
import { ServiceError } from "../services/questionService";

export const examGenerationRouter = Router();
export const batchesRouter = Router();

// POST /api/exams/:id/generate
examGenerationRouter.post("/:id/generate", async (req: Request, res: Response) => {
  try {
    const { count } = req.body;
    const result = await generateBatch(String(req.params.id), count);
    res.json({
      batchId: result.batch.id,
      count: result.batch.count,
      generatedAt: result.batch.generatedAt,
      pdfUrl: result.pdfUrl,
      answersUrl: result.answersUrl,
      sequenceNumberStart: result.batch.sequenceNumberStart,
    });
  } catch (e) {
    if (e instanceof ServiceError) return res.status(e.statusCode).json({ error: e.message });
    throw e;
  }
});

// GET /api/exams/:id/batches
examGenerationRouter.get("/:id/batches", (req: Request, res: Response) => {
  try {
    res.json(getExamBatches(String(req.params.id)));
  } catch (e) {
    if (e instanceof ServiceError) return res.status(e.statusCode).json({ error: e.message });
    throw e;
  }
});

// GET /api/batches/:batchId/pdf
batchesRouter.get("/:batchId/pdf", (req: Request, res: Response) => {
  try {
    const pdf = getBatchPdf(String(req.params.batchId));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="batch-${req.params.batchId}.pdf"`);
    res.send(pdf);
  } catch (e) {
    if (e instanceof ServiceError) return res.status(e.statusCode).json({ error: e.message });
    throw e;
  }
});

// GET /api/batches/:batchId/answers.csv
batchesRouter.get("/:batchId/answers.csv", (req: Request, res: Response) => {
  try {
    const csv = getBatchAnswersCsv(String(req.params.batchId));
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="answers-${req.params.batchId}.csv"`);
    res.send(csv);
  } catch (e) {
    if (e instanceof ServiceError) return res.status(e.statusCode).json({ error: e.message });
    throw e;
  }
});
