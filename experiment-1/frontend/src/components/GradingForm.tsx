import { useRef, useState } from "react";

import { gradeResponses } from "../api/grading";
import Button from "./Button";

interface GradingFormProps {
  addToast: (msg: string, v?: "success" | "error" | "info") => void;
}

function FileDropZone({
  label,
  icon,
  file,
  onFile,
  accept,
}: {
  label: string;
  icon: string;
  file: File | null;
  onFile: (f: File) => void;
  accept: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-3 min-h-[140px] rounded-xl border-2 border-dashed cursor-pointer transition-colors
        ${dragging ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)]" : "border-[var(--color-outline)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-surface)]/50 bg-[var(--color-surface)]"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      {file ? (
        <>
          <span className="material-symbols-rounded text-[var(--color-success)]" style={{ fontSize: 36 }}>
            check_circle
          </span>
          <div className="text-center px-3">
            <p className="text-sm font-medium text-[var(--color-on-surface)]">{file.name}</p>
            <p className="text-xs text-[var(--color-on-surface-muted)]">Clique para substituir</p>
          </div>
        </>
      ) : (
        <>
          <span className="material-symbols-rounded text-[var(--color-on-surface-muted)]" style={{ fontSize: 36 }}>
            {icon}
          </span>
          <div className="text-center px-3">
            <p className="text-sm font-medium text-[var(--color-on-surface)]">{label}</p>
            <p className="text-xs text-[var(--color-on-surface-muted)]">Clique ou arraste um arquivo CSV</p>
          </div>
        </>
      )}
    </div>
  );
}

export default function GradingForm({ addToast }: GradingFormProps) {
  const [answersFile, setAnswersFile] = useState<File | null>(null);
  const [responsesFile, setResponsesFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"strict" | "lenient">("strict");
  const [grading, setGrading] = useState(false);

  const canGrade = answersFile !== null && responsesFile !== null && !grading;

  const handleGrade = async () => {
    if (!answersFile || !responsesFile) return;
    setGrading(true);
    try {
      await gradeResponses(answersFile, responsesFile, mode);
      addToast("Relatório baixado com sucesso.", "success");
    } catch (e) {
      addToast((e as Error).message, "error");
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="max-w-2xl flex flex-col gap-8">
      {/* File zones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide">
            Gabarito
          </span>
          <FileDropZone
            label="Enviar gabarito em CSV"
            icon="vpn_key"
            file={answersFile}
            onFile={setAnswersFile}
            accept=".csv,text/csv"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide">
            Respostas dos alunos
          </span>
          <FileDropZone
            label="Enviar respostas em CSV"
            icon="upload"
            file={responsesFile}
            onFile={setResponsesFile}
            accept=".csv,text/csv"
          />
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide">
          Modo de correção
        </span>
        <div className="flex gap-2">
          {(["strict", "lenient"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex items-center gap-2 h-8 px-4 rounded-full text-sm font-medium transition-colors
                ${
                  mode === m
                    ? "bg-[var(--color-primary-surface)] text-[var(--color-primary)]"
                    : "bg-[var(--color-surface-container)] text-[var(--color-on-surface)] hover:bg-[var(--color-primary-surface)] hover:text-[var(--color-primary)]"
                }`}
              title={
                m === "strict"
                  ? "A resposta deve corresponder exatamente ao gabarito."
                  : "Crédito parcial: pontuação = seleções corretas / total de alternativas."
              }
            >
              {mode === m && (
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                  check
                </span>
              )}
              {m === "strict" ? "Estrito" : "Parcial"}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--color-on-surface-muted)]">
          {mode === "strict"
            ? "Estrito: a resposta do aluno deve corresponder exatamente ao gabarito. Qualquer desvio pontua 0 nessa questão."
            : "Parcial: crédito parcial com base na fração de alternativas corretamente selecionadas ou não selecionadas."}
        </p>
      </div>

      {/* Action */}
      <div>
        <Button icon="grading" disabled={!canGrade} loading={grading} onClick={handleGrade}>
          Corrigir e baixar relatório
        </Button>
      </div>
    </div>
  );
}
