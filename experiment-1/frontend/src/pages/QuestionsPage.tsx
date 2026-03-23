import { useNavigate } from "react-router";

import Button from "../components/Button";
import QuestionList from "../components/QuestionList";
import { useQuestions } from "../hooks/useQuestions";
import { useToast } from "../hooks/useToast";

export default function QuestionsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { questions, total, page, search, loading, onSearch, onPageChange, refresh } = useQuestions();

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-[22px] font-medium leading-7 text-[var(--color-on-surface)]">Questions</h1>
        <Button icon="add" onClick={() => navigate("/questions/new")} size="compact">
          New Question
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <span
          className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-muted)] pointer-events-none"
          style={{ fontSize: 18 }}
        >
          search
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search questions…"
          className="w-full h-10 pl-9 pr-4 rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-container)] text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-muted)] focus:outline-none focus:border-[var(--color-outline-focus)]"
        />
      </div>

      <QuestionList
        questions={questions}
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
