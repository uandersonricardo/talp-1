import { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";

import { gradeResponses } from "../services/gradingService";
import { ServiceError } from "../services/questionService";

const upload = multer({ storage: multer.memoryStorage() });

export const gradingRouter = Router();

// POST /api/grade
gradingRouter.post("/", upload.fields([{ name: "answers" }, { name: "responses" }]), (req: Request, res: Response) => {
  try {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const answersFile = files?.["answers"]?.[0];
    const responsesFile = files?.["responses"]?.[0];
    const mode = req.body.mode as string | undefined;

    if (!answersFile) return res.status(400).json({ error: "Arquivo de gabarito é obrigatório" });
    if (!responsesFile) return res.status(400).json({ error: "Arquivo de respostas é obrigatório" });
    if (!mode) return res.status(400).json({ error: "Modo é obrigatório" });

    const report = gradeResponses(
      answersFile.buffer.toString("utf-8"),
      responsesFile.buffer.toString("utf-8"),
      mode as "strict" | "lenient",
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="report.csv"');
    res.send(report);
  } catch (e) {
    if (e instanceof ServiceError) return res.status(e.statusCode).json({ error: e.message });
    throw e;
  }
});
