import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, Trash2 } from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { createGoal, deleteGoal, listGoals } from "../requests/goals";
import type { Goal } from "../types";

interface GoalForm {
  name: string;
}

type FormErrors = Partial<Record<keyof GoalForm, string>>;

const EMPTY_FORM: GoalForm = { name: "" };

function validateForm(form: GoalForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Nome é obrigatório";
  return errors;
}

export function GoalsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Goal | null>(null);
  const [form, setForm] = useState<GoalForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const {
    data: goals = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["goals"],
    queryFn: listGoals,
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Goal, "id">) => createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      closeModal();
      addToast("Meta criada com sucesso", "success");
    },
    onError: (err: Error) => addToast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setConfirmDelete(null);
      addToast("Meta removida com sucesso", "success");
    },
    onError: (err: Error) => addToast(err.message, "error"),
  });

  function openCreate() {
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setErrors({});
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validation = validateForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    createMutation.mutate({ name: form.name.trim() });
  }

  const isSaving = createMutation.isPending;

  return (
    <div data-testid="goals-page" className="p-6 lg:p-8 pb-24 lg:pb-8">
      {/* Cabeçalho da página */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Metas</h1>
        <button
          type="button"
          data-testid="btn-new-goal"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nova Meta</span>
        </button>
      </div>

      {/* Conteúdo */}
      {isLoading && <p className="text-sm text-[var(--color-text-secondary)]">Carregando metas...</p>}

      {isError && (
        <p className="text-sm text-[var(--color-destructive)]">Erro ao carregar as metas. Tente novamente.</p>
      )}

      {!isLoading && !isError && goals.length === 0 && <EmptyState onAdd={openCreate} />}

      {!isLoading && !isError && goals.length > 0 && (
        <GoalsTable goals={goals} onDelete={setConfirmDelete} />
      )}

      {/* Modal Criar */}
      <Modal
        open={modalOpen}
        title="Nova Meta"
        onClose={closeModal}
        testId="goal-modal"
        footer={
          <>
            <button
              type="button"
              data-testid="btn-cancel-modal"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-variant)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="goal-form"
              data-testid="btn-save-goal"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-text-disabled)] disabled:cursor-not-allowed transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
          </>
        }
      >
        <form id="goal-form" data-testid="goal-form" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <Field
              id="goal-name"
              testId="goal-name-input"
              label="Nome"
              type="text"
              value={form.name}
              placeholder="Nome da meta"
              error={errors.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
            />
          </div>
        </form>
      </Modal>

      {/* Confirmação de exclusão */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Excluir Meta"
        message={`Tem certeza que deseja excluir "${confirmDelete?.name ?? ""}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => {
          if (confirmDelete) deleteMutation.mutate(confirmDelete.id);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ─── Field ───────────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  testId: string;
  label: string;
  type: string;
  value: string;
  placeholder?: string;
  error?: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

function Field({ id, testId, label, type, value, placeholder, error, onChange }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)] mb-1"
      >
        {label}
      </label>
      <input
        id={id}
        data-testid={testId}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className={`w-full px-3 py-2 text-sm rounded-lg border bg-[var(--color-surface)] transition-colors focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(26,110,245,0.15)] ${
          error
            ? "border-[var(--color-destructive)]"
            : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
        }`}
      />
      {error && <p className="mt-1 text-xs text-[var(--color-destructive)]">{error}</p>}
    </div>
  );
}

// ─── GoalsTable ───────────────────────────────────────────────────────────────

interface GoalsTableProps {
  goals: Goal[];
  onDelete: (goal: Goal) => void;
}

function GoalsTable({ goals, onDelete }: GoalsTableProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden overflow-x-auto">
      <table data-testid="goals-table" className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--color-surface-variant)]">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
              Nome
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {goals.map((goal) => (
            <tr
              key={goal.id}
              data-testid="goal-row"
              data-goal-id={goal.id}
              className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-variant)] transition-colors duration-100"
            >
              <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{goal.name}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    data-testid="btn-delete-goal"
                    aria-label={`Excluir ${goal.name}`}
                    onClick={() => onDelete(goal)}
                    className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-destructive-subtle)] hover:text-[var(--color-destructive)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-destructive)]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      data-testid="goals-empty-state"
      className="flex flex-col items-center justify-center py-16 gap-4 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-[var(--color-primary-subtle)] flex items-center justify-center">
        <Target className="text-[var(--color-primary)]" size={28} />
      </div>
      <div>
        <p className="text-base font-medium text-[var(--color-text-primary)]">Nenhuma meta cadastrada</p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Adicione a primeira meta para começar.</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
      >
        <Plus size={16} />
        Nova Meta
      </button>
    </div>
  );
}
