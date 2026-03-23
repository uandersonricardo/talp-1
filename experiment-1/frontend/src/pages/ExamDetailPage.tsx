import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { getExam } from "../api/exams";
import Button from "../components/Button";
import Card from "../components/Card";
import ExamDetail from "../components/ExamDetail";
import GenerationPanel from "../components/GenerationPanel";
import Spinner from "../components/Spinner";
import { useToast } from "../hooks/useToast";
import type { Exam } from "../types";

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getExam(id)
      .then(setExam)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="bg-[var(--color-error-surface)] border border-[var(--color-error)]/30 rounded-xl p-6 text-sm text-[var(--color-error)]">
        {error ?? "Prova não encontrada."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <button
            onClick={() => navigate("/exams")}
            className="flex items-center gap-1 text-sm text-[var(--color-on-surface-muted)] hover:text-[var(--color-on-surface)] transition-colors w-fit"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
              arrow_back
            </span>
            Provas
          </button>
          <h1 className="text-[22px] font-medium leading-7 text-[var(--color-on-surface)] truncate">{exam.title}</h1>
        </div>
        <Button icon="edit" variant="outlined" size="compact" onClick={() => navigate(`/exams/${exam.id}/edit`)}>
          Editar
        </Button>
      </div>

      {/* Metadata card */}
      <Card>
        <ExamDetail exam={exam} />
      </Card>

      {/* Generation card */}
      <Card>
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-medium text-[var(--color-on-surface)]">Gerar provas</h2>
          <GenerationPanel examId={exam.id} addToast={addToast} />
        </div>
      </Card>
    </div>
  );
}
