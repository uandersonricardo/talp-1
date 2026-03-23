import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { createQuestion, getQuestion, updateQuestion } from "../api/questions";
import QuestionForm from "../components/QuestionForm";
import Spinner from "../components/Spinner";
import { useToast } from "../hooks/useToast";
import type { Question } from "../types";

export default function QuestionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const isEdit = Boolean(id);

  const [initial, setInitial] = useState<Question | undefined>();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getQuestion(id)
      .then(setInitial)
      .catch((e) => setFetchError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (data: Omit<Question, "id">) => {
    setSaving(true);
    try {
      if (id) {
        await updateQuestion(id, data);
        addToast("Question updated.", "success");
      } else {
        await createQuestion(data);
        addToast("Question created.", "success");
      }
      navigate("/questions");
    } catch (e) {
      addToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-medium leading-7 text-[var(--color-on-surface)]">
          {isEdit ? "Edit Question" : "New Question"}
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={32} />
        </div>
      ) : fetchError ? (
        <div className="bg-[var(--color-error-surface)] border border-[var(--color-error)]/30 rounded-xl p-6 text-sm text-[var(--color-error)]">
          {fetchError}
        </div>
      ) : (
        <QuestionForm initial={initial} onSave={handleSave} onCancel={() => navigate("/questions")} saving={saving} />
      )}
    </div>
  );
}
