import { useCallback, useEffect, useState } from "react";

import { generateBatch, getBatchAnswersUrl, getBatchPdfUrl, getExamBatches } from "../api/generation";
import type { GenerationBatch } from "../types";
import Button from "./Button";

interface GenerationPanelProps {
  examId: string;
  addToast: (msg: string, v?: "success" | "error" | "info") => void;
}

interface LastResult {
  batchId: string;
  pdfUrl: string;
  answersUrl: string;
  count: number;
}

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
};

export default function GenerationPanel({ examId, addToast }: GenerationPanelProps) {
  const [count, setCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [batches, setBatches] = useState<GenerationBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const loadBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const data = await getExamBatches(examId);
      setBatches(data);
    } catch {
      // best effort
    } finally {
      setLoadingBatches(false);
    }
  }, [examId]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const handleGenerate = async () => {
    if (count < 1) return;
    setGenerating(true);
    setLastResult(null);
    try {
      const result = await generateBatch(examId, count);
      setLastResult({
        batchId: result.batchId,
        pdfUrl: getBatchPdfUrl(result.batchId),
        answersUrl: getBatchAnswersUrl(result.batchId),
        count: result.count,
      });
      addToast(
        `${result.count} prova${result.count !== 1 ? "s" : ""} gerada${result.count !== 1 ? "s" : ""} com sucesso.`,
        "success",
      );
      loadBatches();
    } catch (e) {
      addToast((e as Error).message, "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Generate section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="gen-count"
              className="text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide"
            >
              Número de provas
            </label>
            <input
              id="gen-count"
              type="number"
              min={1}
              max={200}
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="h-10 w-28 px-3 rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-container)] text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-outline-focus)]"
            />
          </div>
          <Button icon="shuffle" loading={generating} onClick={handleGenerate}>
            Gerar
          </Button>
        </div>

        {lastResult && (
          <div className="flex flex-col sm:flex-row gap-3 bg-[var(--color-success-surface)] border border-[var(--color-success)]/30 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="material-symbols-rounded text-[var(--color-success)]" style={{ fontSize: 20 }}>
                check_circle
              </span>
              <span className="text-sm text-[var(--color-success)]">
                {lastResult.count} prova{lastResult.count !== 1 ? "s" : ""} gerada{lastResult.count !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex gap-3">
              <a
                href={lastResult.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                  download
                </span>
                PDF
              </a>
              <a
                href={lastResult.answersUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                  download
                </span>
                Gabarito
              </a>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-[var(--color-on-surface)]">Histórico de geração</h3>

        {loadingBatches ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-lg" />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <p className="text-sm text-[var(--color-on-surface-muted)]">Nenhum lote gerado ainda.</p>
        ) : (
          <div className="rounded-xl border border-[var(--color-outline)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-dim)]">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide">
                    Data
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide">
                    Quantidade
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide hidden sm:table-cell">
                    Sequência
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide">
                    Downloads
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline)]">
                {batches.map((b) => (
                  <tr
                    key={b.id}
                    className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-container)] transition-colors"
                  >
                    <td className="px-4 py-3 text-[var(--color-on-surface)]">{formatDate(b.generatedAt)}</td>
                    <td className="px-4 py-3 text-[var(--color-on-surface-muted)]">{b.count}</td>
                    <td className="px-4 py-3 text-[var(--color-on-surface-muted)] hidden sm:table-cell">
                      #{b.sequenceNumberStart}–#{b.sequenceNumberStart + b.count - 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-4">
                        <a
                          href={getBatchPdfUrl(b.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                            download
                          </span>
                          PDF
                        </a>
                        <a
                          href={getBatchAnswersUrl(b.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                            download
                          </span>
                          CSV
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
