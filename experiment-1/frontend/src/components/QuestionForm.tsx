import { useEffect, useState } from "react";

import type { Alternative, Question } from "../types";
import Button from "./Button";
import Textarea from "./Textarea";

interface QuestionFormProps {
  initial?: Question;
  onSave: (data: Omit<Question, "id">) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

interface AltRow {
  key: string;
  description: string;
  correct: boolean;
}

function newAlt(): AltRow {
  return { key: `${Date.now()}-${Math.random()}`, description: "", correct: false };
}

export default function QuestionForm({ initial, onSave, onCancel, saving = false }: QuestionFormProps) {
  const [statement, setStatement] = useState(initial?.statement ?? "");
  const [alternatives, setAlternatives] = useState<AltRow[]>(
    initial?.alternatives.map((a) => ({ ...a, key: `${Math.random()}` })) ?? [newAlt(), newAlt()],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initial) {
      setStatement(initial.statement);
      setAlternatives(initial.alternatives.map((a) => ({ ...a, key: `${Math.random()}` })));
    }
  }, [initial?.id]); // eslint-disable-line

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!statement.trim()) errs.statement = "Statement is required.";
    if (alternatives.length < 2) errs.alternatives = "At least 2 alternatives are required.";
    alternatives.forEach((a, i) => {
      if (!a.description.trim()) errs[`alt-${i}`] = "Description is required.";
    });
    if (!alternatives.some((a) => a.correct)) errs.correct = "At least one alternative must be correct.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const data: Omit<Question, "id"> = {
      statement: statement.trim(),
      alternatives: alternatives.map((a): Alternative => ({ description: a.description.trim(), correct: a.correct })),
    };
    await onSave(data);
  };

  const updateAlt = (key: string, patch: Partial<AltRow>) => {
    setAlternatives((prev) => prev.map((a) => (a.key === key ? { ...a, ...patch } : a)));
  };

  const removeAlt = (key: string) => {
    setAlternatives((prev) => prev.filter((a) => a.key !== key));
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="max-w-2xl flex flex-col gap-6">
        {/* Summary error */}
        {Object.keys(errors).length > 0 && (
          <div className="flex items-start gap-2 bg-[var(--color-error-surface)] border border-[var(--color-error)]/30 rounded-lg px-4 py-3 text-sm text-[var(--color-error)]">
            <span className="material-symbols-rounded shrink-0" style={{ fontSize: 18 }}>
              error
            </span>
            <span>Please fix the errors below before saving.</span>
          </div>
        )}

        <Textarea
          label="Statement"
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          onBlur={() => {
            if (!statement.trim()) setErrors((p) => ({ ...p, statement: "Statement is required." }));
            else
              setErrors((p) => {
                const n = { ...p };
                delete n.statement;
                return n;
              });
          }}
          placeholder="Enter the question text…"
          error={errors.statement}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide">
              Alternatives
            </span>
            <span className="text-xs text-[var(--color-on-surface-muted)]">Toggle the dot to mark as correct</span>
          </div>

          {(errors.alternatives || errors.correct) && (
            <p className="text-xs text-[var(--color-error)]">{errors.alternatives ?? errors.correct}</p>
          )}

          <div className="flex flex-col gap-2">
            {alternatives.map((alt, idx) => (
              <div
                key={alt.key}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  alt.correct
                    ? "bg-[var(--color-success-surface)] border-[var(--color-success)]/40"
                    : "bg-[var(--color-surface)] border-[var(--color-outline)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => updateAlt(alt.key, { correct: !alt.correct })}
                  aria-label={alt.correct ? "Mark as incorrect" : "Mark as correct"}
                  className="flex shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                >
                  <span
                    className="material-symbols-rounded transition-colors"
                    style={{
                      fontSize: 20,
                      color: alt.correct ? "var(--color-success)" : "var(--color-outline)",
                    }}
                  >
                    {alt.correct ? "check_circle" : "radio_button_unchecked"}
                  </span>
                </button>

                <div className="flex-1 flex flex-col gap-1">
                  <input
                    type="text"
                    value={alt.description}
                    onChange={(e) => updateAlt(alt.key, { description: e.target.value })}
                    placeholder={`Alternative ${idx + 1}`}
                    className={`w-full h-9 px-3 rounded-lg border text-sm bg-transparent text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-muted)] focus:outline-none transition-colors
                      ${errors[`alt-${idx}`] ? "border-[var(--color-error)]" : "border-transparent focus:border-[var(--color-outline-focus)]"}`}
                  />
                  {errors[`alt-${idx}`] && <p className="text-xs text-[var(--color-error)]">{errors[`alt-${idx}`]}</p>}
                </div>

                <button
                  type="button"
                  onClick={() => removeAlt(alt.key)}
                  disabled={alternatives.length <= 2}
                  aria-label="Remove alternative"
                  className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-[var(--color-on-surface-muted)] hover:bg-[var(--color-error-surface)] hover:text-[var(--color-error)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                    close
                  </span>
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAlternatives((prev) => [...prev, newAlt()])}
            className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] py-1.5 w-fit transition-colors"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
              add
            </span>
            Add alternative
          </button>
        </div>

        {/* Actions — sticky on mobile */}
        <div className="flex gap-3 pt-2 sticky bottom-0 bg-[var(--color-surface-dim)] py-4 -mx-4 px-4 sm:static sm:bg-transparent sm:mx-0 sm:px-0 sm:py-0">
          <Button type="submit" loading={saving}>
            {initial ? "Save changes" : "Create question"}
          </Button>
          <Button type="button" variant="outlined" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
