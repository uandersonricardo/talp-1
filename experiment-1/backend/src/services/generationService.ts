import { randomUUID } from "node:crypto";
import PDFDocument from "pdfkit";

import { batchCsvs, batchPdfs, exams, generationBatches, individualExams, questions } from "../db";
import type { Exam, GenerationBatch, IndividualExam } from "../types";
import { ServiceError } from "./questionService";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function alternativeLabel(mode: "letters" | "powers", index: number): string {
  return mode === "letters" ? String.fromCharCode(65 + index) : String(Math.pow(2, index));
}

function computeAnswer(mode: "letters" | "powers", altOrder: number[], alts: { correct: boolean }[]): string {
  if (mode === "letters") {
    return altOrder
      .map((origIdx, shuffledPos) => ({ origIdx, shuffledPos }))
      .filter(({ origIdx }) => alts[origIdx].correct)
      .map(({ shuffledPos }) => String.fromCharCode(65 + shuffledPos))
      .join("");
  }
  const total = altOrder
    .map((origIdx, shuffledPos) => ({ origIdx, shuffledPos }))
    .filter(({ origIdx }) => alts[origIdx].correct)
    .reduce((acc, { shuffledPos }) => acc + Math.pow(2, shuffledPos), 0);
  return String(total);
}

function buildCsv(exam: Exam, batchIndividuals: IndividualExam[]): string {
  const header = ["exam_number", ...exam.questions].join(",");
  const rows = batchIndividuals.map((ind) => {
    const answers = exam.questions.map((qId) => {
      const question = questions.find((q) => q.id === qId)!;
      return computeAnswer(exam.identifierMode, ind.alternativeOrders[qId], question.alternatives);
    });
    return [ind.sequenceNumber, ...answers].join(",");
  });
  return [header, ...rows].join("\n");
}

function buildPdf(exam: Exam, batchIndividuals: IndividualExam[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    for (let i = 0; i < batchIndividuals.length; i++) {
      const ind = batchIndividuals[i];
      if (i > 0) doc.addPage();

      // Header
      doc
        .fontSize(10)
        .text(`${exam.course}  |  ${exam.professor}  |  ${exam.date}  |  ${exam.title}`, { align: "center" })
        .moveDown(1);

      // Questions
      ind.questionOrder.forEach((qId, qIdx) => {
        const question = questions.find((q) => q.id === qId)!;
        const altOrder = ind.alternativeOrders[qId];
        doc
          .fontSize(12)
          .text(`${qIdx + 1}. ${question.statement}`)
          .moveDown(0.5);
        altOrder.forEach((origIdx, shuffledPos) => {
          const label = alternativeLabel(exam.identifierMode, shuffledPos);
          doc.fontSize(11).text(`   ${label}) ${question.alternatives[origIdx].description}`);
        });
        const ansLabel = exam.identifierMode === "letters" ? "Resposta: ___" : "Soma: ___";
        doc.moveDown(0.5).fontSize(11).text(ansLabel).moveDown(1);
      });

      // Student info section
      doc
        .moveDown(2)
        .fontSize(12)
        .text("Nome: ________________________________")
        .moveDown(1)
        .text("CPF: _________________________________");

      // Sequence number
      doc.moveDown(2).fontSize(9).text(`Prova #${ind.sequenceNumber}`, { align: "center" });
    }

    doc.end();
  });
}

export async function generateBatch(
  examId: string,
  count: unknown,
): Promise<{ batch: GenerationBatch; pdfUrl: string; answersUrl: string }> {
  if (!Number.isInteger(count) || (count as number) < 1) {
    throw new ServiceError(400, "Quantidade deve ser um número inteiro positivo");
  }
  const n = count as number;

  const exam = exams.find((e) => e.id === examId);
  if (!exam) throw new ServiceError(404, "Prova não encontrada");

  const existing = generationBatches.filter((b) => b.examId === examId);
  const sequenceNumberStart =
    existing.length > 0 ? Math.max(...existing.map((b) => b.sequenceNumberStart + b.count - 1)) + 1 : 1;

  const batchIndividuals: IndividualExam[] = Array.from({ length: n }, (_, i) => {
    const questionOrder = shuffle(exam.questions);
    const alternativeOrders: Record<string, number[]> = {};
    for (const qId of exam.questions) {
      const question = questions.find((q) => q.id === qId)!;
      alternativeOrders[qId] = shuffle(question.alternatives.map((_, idx) => idx));
    }
    return { examId, sequenceNumber: sequenceNumberStart + i, questionOrder, alternativeOrders };
  });

  const batch: GenerationBatch = {
    id: randomUUID(),
    examId,
    count: n,
    generatedAt: new Date().toISOString(),
    sequenceNumberStart,
  };

  const pdfBuffer = await buildPdf(exam, batchIndividuals);
  const csvString = buildCsv(exam, batchIndividuals);

  generationBatches.push(batch);
  individualExams.push(...batchIndividuals);
  batchPdfs.set(batch.id, pdfBuffer);
  batchCsvs.set(batch.id, csvString);

  return {
    batch,
    pdfUrl: `/api/batches/${batch.id}/pdf`,
    answersUrl: `/api/batches/${batch.id}/answers.csv`,
  };
}

export function getExamBatches(examId: string): GenerationBatch[] {
  const exam = exams.find((e) => e.id === examId);
  if (!exam) throw new ServiceError(404, "Prova não encontrada");
  return generationBatches.filter((b) => b.examId === examId);
}

export function getBatchPdf(batchId: string): Buffer {
  const pdf = batchPdfs.get(batchId);
  if (!pdf) throw new ServiceError(404, "Lote não encontrado");
  return pdf;
}

export function getBatchAnswersCsv(batchId: string): string {
  const csv = batchCsvs.get(batchId);
  if (csv === undefined) throw new ServiceError(404, "Lote não encontrado");
  return csv;
}
