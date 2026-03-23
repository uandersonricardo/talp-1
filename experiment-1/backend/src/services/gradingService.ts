import { exams, questions } from "../db";
import { ServiceError } from "./questionService";

type GradingMode = "strict" | "lenient";
type IdentifierMode = "letters" | "powers";

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",");
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").trim();
    });
    return row;
  });
  return { headers, rows };
}

function detectIdentifierMode(keyRows: Record<string, string>[], questionIds: string[]): IdentifierMode {
  for (const row of keyRows) {
    for (const qId of questionIds) {
      if (/[A-Za-z]/.test(row[qId] ?? "")) return "letters";
    }
  }
  return "powers";
}

function gradeStrict(keyCell: string, studentCell: string): number {
  return keyCell.trim().toUpperCase() === studentCell.trim().toUpperCase() ? 1 : 0;
}

function gradeLenient(mode: IdentifierMode, keyCell: string, studentCell: string, totalAlts: number): number {
  if (totalAlts === 0) return 0;

  if (mode === "letters") {
    const keySet = new Set(
      keyCell
        .trim()
        .toUpperCase()
        .split("")
        .filter((c) => /[A-Z]/.test(c)),
    );
    const studentSet = new Set(
      studentCell
        .trim()
        .toUpperCase()
        .split("")
        .filter((c) => /[A-Z]/.test(c)),
    );
    let correct = 0;
    for (let i = 0; i < totalAlts; i++) {
      const letter = String.fromCharCode(65 + i);
      if (keySet.has(letter) === studentSet.has(letter)) correct++;
    }
    return correct / totalAlts;
  }

  // powers mode
  const keyVal = parseInt(keyCell.trim(), 10) || 0;
  const studentVal = parseInt(studentCell.trim(), 10) || 0;
  let correct = 0;
  for (let i = 0; i < totalAlts; i++) {
    if (((keyVal >> i) & 1) === ((studentVal >> i) & 1)) correct++;
  }
  return correct / totalAlts;
}

function formatScore(score: number): string {
  return String(parseFloat(score.toFixed(4)));
}

export function gradeResponses(answerKeyCsv: string, responsesCsv: string, gradingMode: GradingMode): string {
  if (!["strict", "lenient"].includes(gradingMode)) {
    throw new ServiceError(400, "Modo deve ser 'strict' ou 'lenient'");
  }

  const { headers: keyHeaders, rows: keyRows } = parseCsv(answerKeyCsv);
  const { headers: responseHeaders, rows: responseRows } = parseCsv(responsesCsv);

  if (keyHeaders.length === 0) throw new ServiceError(400, "CSV do gabarito está vazio");
  if (responseHeaders.length === 0) throw new ServiceError(400, "CSV de respostas está vazio");

  // Question IDs are all columns after exam_number in the answer key
  const questionIds = keyHeaders.slice(1);

  // Build answer key lookup: exam_number → row
  const keyMap = new Map<string, Record<string, string>>();
  for (const row of keyRows) {
    const examNum = row["exam_number"];
    if (examNum) keyMap.set(examNum, row);
  }

  // Determine identifier mode: check DB first, then infer from values
  let identifierMode: IdentifierMode = "letters";
  if (questionIds.length > 0) {
    const exam = exams.find((e) => questionIds.every((qId) => e.questions.includes(qId)));
    identifierMode = exam ? exam.identifierMode : detectIdentifierMode(keyRows, questionIds);
  }

  // Total alternatives per question — needed for lenient grading
  const totalAltsMap = new Map<string, number>();
  for (const qId of questionIds) {
    const question = questions.find((q) => q.id === qId);
    totalAltsMap.set(qId, question?.alternatives.length ?? 2);
  }

  // Detect optional metadata columns in responses CSV
  const hasStudentName = responseHeaders.includes("student_name");
  const hasCpf = responseHeaders.includes("cpf");

  // Question answer columns in responses CSV (positional, skipping metadata)
  const skipCols = new Set(["exam_number", "student_name", "cpf"]);
  const responseQuestionCols = responseHeaders.filter((h) => !skipCols.has(h));

  const reportLines: string[] = [];

  // Report header
  const headerCols = [
    "exam_number",
    ...(hasStudentName ? ["student_name"] : []),
    ...(hasCpf ? ["cpf"] : []),
    ...questionIds.map((_, i) => `q${i + 1}_score`),
    "total_score",
  ];
  reportLines.push(headerCols.join(","));

  for (const responseRow of responseRows) {
    const examNum = responseRow["exam_number"]?.trim();
    if (!examNum) continue;

    const keyRow = keyMap.get(examNum);
    if (!keyRow) {
      console.warn(`Aviso: número de prova ${examNum} não encontrado no gabarito`);
    }

    const perQuestionScores = questionIds.map((qId, i) => {
      const keyCell = keyRow ? (keyRow[qId] ?? "") : "";
      const studentCell = responseQuestionCols[i] ? (responseRow[responseQuestionCols[i]] ?? "") : "";

      if (gradingMode === "strict") return gradeStrict(keyCell, studentCell);
      return gradeLenient(identifierMode, keyCell, studentCell, totalAltsMap.get(qId) ?? 2);
    });

    const totalScore = perQuestionScores.reduce((a, b) => a + b, 0);
    const row = [
      examNum,
      ...(hasStudentName ? [responseRow["student_name"] ?? ""] : []),
      ...(hasCpf ? [responseRow["cpf"] ?? ""] : []),
      ...perQuestionScores.map(formatScore),
      formatScore(totalScore),
    ];
    reportLines.push(row.join(","));
  }

  return reportLines.join("\n");
}
