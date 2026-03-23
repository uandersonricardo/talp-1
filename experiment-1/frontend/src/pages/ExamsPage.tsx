import { useNavigate } from "react-router";

import Button from "../components/Button";
import ExamList from "../components/ExamList";
import { useExams } from "../hooks/useExams";
import { useToast } from "../hooks/useToast";

export default function ExamsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { exams, total, page, loading, onPageChange, refresh } = useExams();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-[22px] font-medium leading-7 text-[var(--color-on-surface)]">Provas</h1>
        <Button icon="add" onClick={() => navigate("/exams/new")} size="compact">
          Nova Prova
        </Button>
      </div>

      <ExamList
        exams={exams}
        total={total}
        page={page}
        loading={loading}
        onPageChange={onPageChange}
        onDeleted={refresh}
        addToast={addToast}
      />
    </div>
  );
}
