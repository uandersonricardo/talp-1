import { useCallback, useEffect, useState } from "react";

import { listQuestions } from "../api/questions";
import type { Exam, Question } from "../types";
import Button from "./Button";
import Input from "./Input";
import Select from "./Select";
import Spinner from "./Spinner";

interface ExamFormProps {
  initial?: Exam;
  onSave: (data: Omit<Exam, "id">) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

interface FormData {
  title: string;
  course: string;
  professor: string;
  date: string;
  identifierMode: "letters" | "powers";
}

export default function ExamForm({ initial, onSave, onCancel, saving = false }: ExamFormProps) {
  const [form, setForm] = useState<FormData>({
    title: initial?.title ?? "",
    course: initial?.course ?? "",
    professor: initial?.professor ?? "",
    date: initial?.date ? initial.date.slice(0, 10) : "",
    identifierMode: initial?.identifierMode ?? "letters",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>(initial?.questions ?? []);

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [qSearch, setQSearch] = useState("");
  const [qLoading, setQLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadQuestions = useCallback(async (search: string) => {
    setQLoading(true);
    try {
      const res = await listQuestions({ search, limit: 100 });
      setAllQuestions(res.data);
    } catch {
      // best effort
    } finally {
      setQLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions("");
  }, [loadQuestions]);

  const field = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setErrors((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });
  };

  const toggleQuestion = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]));
    setErrors((p) => {
      const n = { ...p };
      delete n.questions;
      return n;
    });
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setSelectedIds((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    setSelectedIds((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Título é obrigatório.";
    if (!form.course.trim()) errs.course = "Disciplina é obrigatória.";
    if (!form.professor.trim()) errs.professor = "Professor é obrigatório.";
    if (!form.date) errs.date = "Data é obrigatória.";
    if (selectedIds.length === 0) errs.questions = "Selecione pelo menos uma questão.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave({
      title: form.title.trim(),
      course: form.course.trim(),
      professor: form.professor.trim(),
      date: form.date,
      identifierMode: form.identifierMode,
      questions: selectedIds,
    });
  };

  const qMap = new Map(allQuestions.map((q) => [q.id, q]));

  const filteredAvailable = allQuestions.filter(
    (q) => !selectedIds.includes(q.id) && q.statement.toLowerCase().includes(qSearch.toLowerCase()),
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-6">
        {Object.keys(errors).length > 0 && (
          <div className="flex items-start gap-2 bg-[var(--color-error-surface)] border border-[var(--color-error)]/30 rounded-lg px-4 py-3 text-sm text-[var(--color-error)]">
            <span className="material-symbols-rounded shrink-0" style={{ fontSize: 18 }}>
              error
            </span>
            <span>Corrija os erros abaixo antes de salvar.</span>
          </div>
        )}

        {/* Two-column on xl: metadata + question selector */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Metadata */}
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-medium text-[var(--color-on-surface)]">Detalhes da prova</h2>

            <Input
              label="Título"
              value={form.title}
              onChange={field("title")}
              placeholder="ex.: Prova de Cálculo"
              error={errors.title}
            />
            <Input
              label="Disciplina"
              value={form.course}
              onChange={field("course")}
              placeholder="ex.: Cálculo 101"
              error={errors.course}
            />
            <Input
              label="Professor"
              value={form.professor}
              onChange={field("professor")}
              placeholder="ex.: Dr. Silva"
              error={errors.professor}
            />
            <Input label="Data" type="date" value={form.date} onChange={field("date")} error={errors.date} />
            <Select
              label="Modo de identificação"
              value={form.identifierMode}
              onChange={field("identifierMode")}
              options={[
                { value: "letters", label: "Letras (A, B, C…)" },
                { value: "powers", label: "Potências (1, 2, 4, 8…)" },
              ]}
            />
          </div>

          {/* Question selector */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-[var(--color-on-surface)]">Questões</h2>
              {selectedIds.length > 0 && (
                <span className="text-xs text-[var(--color-on-surface-muted)]">
                  {selectedIds.length} selecionada(s)
                </span>
              )}
            </div>

            {errors.questions && <p className="text-xs text-[var(--color-error)]">{errors.questions}</p>}

            {/* Available questions */}
            <div className="flex flex-col gap-2">
              <div className="relative">
                <span
                  className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-muted)] pointer-events-none"
                  style={{ fontSize: 18 }}
                >
                  search
                </span>
                <input
                  type="search"
                  value={qSearch}
                  onChange={(e) => setQSearch(e.target.value)}
                  placeholder="Buscar questões disponíveis…"
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-container)] text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-muted)] focus:outline-none focus:border-[var(--color-outline-focus)]"
                />
              </div>

              <div className="max-h-48 overflow-y-auto border border-[var(--color-outline)] rounded-lg divide-y divide-[var(--color-outline)]">
                {qLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner size={20} />
                  </div>
                ) : filteredAvailable.length === 0 ? (
                  <p className="text-sm text-[var(--color-on-surface-muted)] text-center py-6 px-4">
                    {qSearch ? "Nenhuma questão corresponde à busca." : "Todas as questões foram adicionadas."}
                  </p>
                ) : (
                  filteredAvailable.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => toggleQuestion(q.id)}
                      className="w-full text-left px-3 py-2.5 text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-primary-surface)] hover:text-[var(--color-primary)] transition-colors flex items-start gap-2"
                    >
                      <span
                        className="material-symbols-rounded mt-0.5 shrink-0 text-[var(--color-primary)]"
                        style={{ fontSize: 16 }}
                      >
                        add
                      </span>
                      <span className="line-clamp-2">{q.statement}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Selected questions */}
            {selectedIds.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide">
                  Adicionadas — arraste para reordenar
                </p>
                <div className="border border-[var(--color-outline)] rounded-lg divide-y divide-[var(--color-outline)] overflow-hidden">
                  {selectedIds.map((id, idx) => {
                    const q = qMap.get(id);
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-surface-container)] transition-colors"
                      >
                        <span className="text-xs font-medium text-[var(--color-on-surface-muted)] w-5 shrink-0 text-right">
                          {idx + 1}.
                        </span>
                        <p className="flex-1 text-sm text-[var(--color-on-surface)] line-clamp-1 min-w-0">
                          {q?.statement ?? id}
                        </p>
                        <div className="flex gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveUp(idx)}
                            disabled={idx === 0}
                            aria-label="Mover para cima"
                            className="flex items-center justify-center w-6 h-6 rounded text-[var(--color-on-surface-muted)] hover:bg-[var(--color-surface-container)] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                              keyboard_arrow_up
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDown(idx)}
                            disabled={idx === selectedIds.length - 1}
                            aria-label="Mover para baixo"
                            className="flex items-center justify-center w-6 h-6 rounded text-[var(--color-on-surface-muted)] hover:bg-[var(--color-surface-container)] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                              keyboard_arrow_down
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleQuestion(id)}
                            aria-label="Remover questão"
                            className="flex items-center justify-center w-6 h-6 rounded text-[var(--color-on-surface-muted)] hover:bg-[var(--color-error-surface)] hover:text-[var(--color-error)]"
                          >
                            <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                              close
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 sticky bottom-0 bg-[var(--color-surface-dim)] py-4 -mx-4 px-4 sm:static sm:bg-transparent sm:mx-0 sm:px-0 sm:py-0">
          <Button type="submit" loading={saving}>
            {initial ? "Salvar alterações" : "Criar prova"}
          </Button>
          <Button type="button" variant="outlined" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        </div>
      </div>
    </form>
  );
}
