import { useState } from "react";
import { useNavigate } from "react-router";

import { deleteQuestion } from "../api/questions";
import type { Question } from "../types";
import { ConfirmDialog } from "./Dialog";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";

interface QuestionListProps {
  questions: Question[];
  total: number;
  page: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onDeleted: () => void;
  addToast: (msg: string, v?: "success" | "error" | "info") => void;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          <td className="px-4 py-3">
            <div className="skeleton h-4 w-3/4 rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="skeleton h-4 w-12 rounded" />
          </td>
          <td className="px-4 py-3 w-24" />
        </tr>
      ))}
    </>
  );
}

export default function QuestionList({
  questions,
  total,
  page,
  loading,
  onPageChange,
  onDeleted,
  addToast,
}: QuestionListProps) {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQuestion(deleteTarget.id);
      addToast("Question deleted.", "success");
      onDeleted();
    } catch (e) {
      addToast((e as Error).message, "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (!loading && questions.length === 0) {
    return <EmptyState icon="quiz" title="No questions yet" description="Create your first question to get started." />;
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block rounded-xl border border-[var(--color-outline)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-surface-dim)]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide">
                Statement
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide w-32">
                Alternatives
              </th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-outline)]">
            {loading ? (
              <SkeletonRows />
            ) : (
              questions.map((q) => (
                <tr
                  key={q.id}
                  className="group bg-[var(--color-surface)] hover:bg-[var(--color-surface-container)] transition-colors"
                >
                  <td className="px-4 py-3 text-[var(--color-on-surface)] max-w-0">
                    <p className="truncate">{q.statement}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-on-surface-muted)]">{q.alternatives.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/questions/${q.id}/edit`)}
                        aria-label="Edit question"
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-on-surface-muted)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)] transition-colors"
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                          edit
                        </span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(q)}
                        aria-label="Delete question"
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-on-surface-muted)] hover:bg-[var(--color-error-surface)] hover:text-[var(--color-error)] transition-colors"
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden flex flex-col gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)
          : questions.map((q) => (
              <div key={q.id} className="bg-[var(--color-surface)] border border-[var(--color-outline)] rounded-xl p-4">
                <p className="text-sm font-medium text-[var(--color-on-surface)] line-clamp-2 mb-2">{q.statement}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-on-surface-muted)]">
                    {q.alternatives.length} alternatives
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => navigate(`/questions/${q.id}/edit`)}
                      aria-label="Edit question"
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-on-surface-muted)] hover:bg-[var(--color-surface-container)] transition-colors"
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                        edit
                      </span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(q)}
                      aria-label="Delete question"
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-on-surface-muted)] hover:bg-[var(--color-error-surface)] hover:text-[var(--color-error)] transition-colors"
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
      </div>

      <Pagination page={page} total={total} limit={20} onChange={onPageChange} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete question?"
        description={`"${deleteTarget?.statement.slice(0, 80)}" will be permanently deleted. This cannot be undone.`}
      />
    </>
  );
}
