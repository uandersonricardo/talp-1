import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, Trash2 } from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import { createGoal, deleteGoal, listGoals } from "../requests/goals";
import type { Goal } from "../types";

export function GoalsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Goal | null>(null);

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
      setName("");
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

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Nome é obrigatório");
      return;
    }
    if (goals.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())) {
      addToast("Já existe uma meta com esse nome", "error");
      return;
    }
    createMutation.mutate({ name: trimmed });
  }

  return (
    <div data-testid="goals-page" className="p-6 lg:p-8 pb-24 lg:pb-8">
      {/* Cabeçalho da página */}
      <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Metas</h1>

      {/* Formulário inline */}
      <form data-testid="goal-form" onSubmit={handleSubmit} noValidate className="mb-6">
        <div className="flex gap-2 items-start">
          <div className="flex-1 min-w-0">
            <input
              data-testid="goal-name-input"
              type="text"
              value={name}
              placeholder="Nome da meta"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-[var(--color-surface)] transition-colors focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(26,110,245,0.15)] ${
                nameError
                  ? "border-[var(--color-destructive)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
              }`}
            />
            {nameError && (
              <p data-testid="goal-name-error" className="mt-1 text-xs text-[var(--color-destructive)]">
                {nameError}
              </p>
            )}
          </div>
          <button
            type="submit"
            data-testid="btn-add-goal"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-text-disabled)] disabled:cursor-not-allowed transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)] shrink-0"
          >
            <Plus size={16} />
            Adicionar
          </button>
        </div>
      </form>

      {/* Conteúdo */}
      {isLoading && <p className="text-sm text-[var(--color-text-secondary)]">Carregando metas...</p>}

      {isError && (
        <p className="text-sm text-[var(--color-destructive)]">Erro ao carregar as metas. Tente novamente.</p>
      )}

      {!isLoading && !isError && goals.length === 0 && <EmptyState />}

      {!isLoading && !isError && goals.length > 0 && (
        <GoalsTable goals={goals} onDelete={setConfirmDelete} />
      )}

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

function EmptyState() {
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
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Use o campo acima para adicionar a primeira meta.</p>
      </div>
    </div>
  );
}
