import { useState } from "react";
import { useNavigate } from "react-router";

import { deleteExam } from "../api/exams";
import type { Exam } from "../types";
import { ConfirmDialog } from "./Dialog";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";

interface ExamListProps {
  exams: Exam[];
  total: number;
  page: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onDeleted: () => void;
  addToast: (msg: string, v?: "success" | "error" | "info") => void;
}

export default function ExamList({ exams, total, page, loading, onPageChange, onDeleted, addToast }: ExamListProps) {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExam(deleteTarget.id);
      addToast("Exam deleted.", "success");
      onDeleted();
    } catch (e) {
      addToast((e as Error).message, "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (!loading && exams.length === 0) {
    return <EmptyState icon="article" title="No exams yet" description="Create your first exam to get started." />;
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return d;
    }
  };

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block rounded-xl border border-[var(--color-outline)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-surface-dim)]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide">
                Title
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide hidden md:table-cell">
                Course
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide hidden md:table-cell">
                Date
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide w-28">
                Mode
              </th>
              <th className="w-28" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-outline)]">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <div className="skeleton h-4 w-3/4 rounded" />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="skeleton h-4 w-1/2 rounded" />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="skeleton h-4 w-24 rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="skeleton h-4 w-16 rounded" />
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              : exams.map((exam) => (
                  <tr
                    key={exam.id}
                    className="group bg-[var(--color-surface)] hover:bg-[var(--color-surface-container)] transition-colors cursor-pointer"
                    onClick={() => navigate(`/exams/${exam.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-[var(--color-on-surface)] max-w-0">
                      <p className="truncate">{exam.title}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-on-surface-muted)] hidden md:table-cell">
                      {exam.course}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-on-surface-muted)] hidden md:table-cell">
                      {formatDate(exam.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center h-6 px-2 rounded-full text-xs font-medium bg-[var(--color-surface-container)] text-[var(--color-on-surface-muted)]">
                        {exam.identifierMode}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/exams/${exam.id}/edit`);
                          }}
                          aria-label="Edit exam"
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-on-surface-muted)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)] transition-colors"
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                            edit
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(exam);
                          }}
                          aria-label="Delete exam"
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-on-surface-muted)] hover:bg-[var(--color-error-surface)] hover:text-[var(--color-error)] transition-colors"
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden flex flex-col gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)
          : exams.map((exam) => (
              <div
                key={exam.id}
                onClick={() => navigate(`/exams/${exam.id}`)}
                className="bg-[var(--color-surface)] border border-[var(--color-outline)] rounded-xl p-4 cursor-pointer hover:bg-[var(--color-surface-container)] transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-[var(--color-on-surface)] line-clamp-1">{exam.title}</p>
                  <span className="shrink-0 inline-flex items-center h-5 px-2 rounded-full text-xs bg-[var(--color-surface-container)] text-[var(--color-on-surface-muted)]">
                    {exam.identifierMode}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-on-surface-muted)]">
                  {exam.course} · {formatDate(exam.date)}
                </p>
                <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/exams/${exam.id}/edit`)}
                    aria-label="Edit exam"
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-on-surface-muted)] hover:bg-[var(--color-surface-container)] transition-colors"
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                      edit
                    </span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(exam)}
                    aria-label="Delete exam"
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-on-surface-muted)] hover:bg-[var(--color-error-surface)] hover:text-[var(--color-error)] transition-colors"
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                      delete
                    </span>
                  </button>
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
        title="Delete exam?"
        description={`"${deleteTarget?.title}" and all its data will be permanently deleted.`}
      />
    </>
  );
}
