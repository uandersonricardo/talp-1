import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { Link } from "react-router";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { createClass, deleteClass, listClasses, updateClass } from "../requests/classes";
import type { Class } from "../types";

interface ClassForm {
  description: string;
  year: string;
  semester: "1" | "2";
}

type FormErrors = Partial<Record<keyof ClassForm, string>>;

const EMPTY_FORM: ClassForm = {
  description: "",
  year: String(new Date().getFullYear()),
  semester: "1",
};

function validateForm(form: ClassForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.description.trim()) errors.description = "Descrição é obrigatória";
  const y = Number(form.year);
  if (!form.year || !Number.isInteger(y) || y < 2000 || y > 2100) errors.year = "Ano inválido (ex: 2026)";
  return errors;
}

export function ClassesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Class | null>(null);
  const [form, setForm] = useState<ClassForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const {
    data: classes = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["classes"],
    queryFn: listClasses,
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Class, "id" | "studentIds">) => createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      closeModal();
      addToast("Turma criada com sucesso", "success");
    },
    onError: (err: Error) => addToast(err.message, "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<Class, "id" | "studentIds"> }) => updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      closeModal();
      addToast("Turma atualizada com sucesso", "success");
    },
    onError: (err: Error) => addToast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setConfirmDelete(null);
      addToast("Turma removida com sucesso", "success");
    },
    onError: (err: Error) => addToast(err.message, "error"),
  });

  function openCreate() {
    setEditingClass(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(cls: Class) {
    setEditingClass(cls);
    setForm({
      description: cls.description,
      year: String(cls.year),
      semester: String(cls.semester) as "1" | "2",
    });
    setErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingClass(null);
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
    const data = {
      description: form.description.trim(),
      year: Number(form.year),
      semester: Number(form.semester) as 1 | 2,
    };
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div data-testid="classes-page" className="p-6 lg:p-8 pb-24 lg:pb-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Turmas</h1>
        <button
          type="button"
          data-testid="btn-new-class"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nova Turma</span>
        </button>
      </div>

      {isLoading && <p className="text-sm text-[var(--color-text-secondary)]">Carregando turmas...</p>}

      {isError && (
        <p className="text-sm text-[var(--color-destructive)]">Erro ao carregar as turmas. Tente novamente.</p>
      )}

      {!isLoading && !isError && classes.length === 0 && <EmptyState onAdd={openCreate} />}

      {!isLoading && !isError && classes.length > 0 && (
        <ClassesTable classes={classes} onEdit={openEdit} onDelete={setConfirmDelete} />
      )}

      {/* Modal Criar / Editar */}
      <Modal
        open={modalOpen}
        title={editingClass ? "Editar Turma" : "Nova Turma"}
        onClose={closeModal}
        testId="class-modal"
        footer={
          <>
            <button
              type="button"
              data-testid="btn-cancel-class-modal"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-variant)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="class-form"
              data-testid="btn-save-class"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-text-disabled)] disabled:cursor-not-allowed transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
          </>
        }
      >
        <form id="class-form" data-testid="class-form" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <Field
              id="class-description"
              testId="class-description-input"
              label="Descrição"
              type="text"
              value={form.description}
              placeholder="Ex: Introdução à Programação"
              error={errors.description}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, description: e.target.value }));
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
            />
            <Field
              id="class-year"
              testId="class-year-input"
              label="Ano"
              type="text"
              inputMode="numeric"
              value={form.year}
              placeholder="2026"
              error={errors.year}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, year: e.target.value }));
                if (errors.year) setErrors((prev) => ({ ...prev, year: undefined }));
              }}
            />
            <SemesterSelect
              value={form.semester}
              error={errors.semester}
              onChange={(v) => {
                setForm((prev) => ({ ...prev, semester: v }));
                if (errors.semester) setErrors((prev) => ({ ...prev, semester: undefined }));
              }}
            />
          </div>
        </form>
      </Modal>

      {/* Confirmação de exclusão */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Excluir Turma"
        message={`Tem certeza que deseja excluir "${confirmDelete?.description ?? ""}"? Esta ação não pode ser desfeita.`}
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
  inputMode?: "numeric" | "email" | "text";
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

function Field({ id, testId, label, type, value, placeholder, error, inputMode, onChange }: FieldProps) {
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
        inputMode={inputMode}
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

// ─── SemesterSelect ───────────────────────────────────────────────────────────

interface SemesterSelectProps {
  value: "1" | "2";
  error?: string;
  onChange: (v: "1" | "2") => void;
}

function SemesterSelect({ value, error, onChange }: SemesterSelectProps) {
  return (
    <div>
      <label
        htmlFor="class-semester"
        className="block text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)] mb-1"
      >
        Semestre
      </label>
      <select
        id="class-semester"
        data-testid="class-semester-select"
        value={value}
        onChange={(e) => onChange(e.target.value as "1" | "2")}
        className={`w-full px-3 py-2 text-sm rounded-lg border bg-[var(--color-surface)] transition-colors focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(26,110,245,0.15)] ${
          error
            ? "border-[var(--color-destructive)]"
            : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
        }`}
      >
        <option value="1">1º Semestre</option>
        <option value="2">2º Semestre</option>
      </select>
      {error && <p className="mt-1 text-xs text-[var(--color-destructive)]">{error}</p>}
    </div>
  );
}

// ─── ClassesTable ─────────────────────────────────────────────────────────────

interface ClassesTableProps {
  classes: Class[];
  onEdit: (cls: Class) => void;
  onDelete: (cls: Class) => void;
}

function ClassesTable({ classes, onEdit, onDelete }: ClassesTableProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden overflow-x-auto">
      <table data-testid="classes-table" className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--color-surface-variant)]">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
              Descrição
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
              Ano
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
              Semestre
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
              Alunos
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {classes.map((cls) => (
            <tr
              key={cls.id}
              data-testid="class-row"
              data-class-id={cls.id}
              className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-variant)] transition-colors duration-100"
            >
              <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                <Link
                  to={`/turmas/${cls.id}`}
                  data-testid="btn-view-class"
                  className="hover:text-[var(--color-primary)] hover:underline transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)] rounded"
                >
                  {cls.description}
                </Link>
              </td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">{cls.year}</td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">{cls.semester}º</td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">{cls.studentIds.length}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    data-testid="btn-edit-class"
                    aria-label={`Editar ${cls.description}`}
                    onClick={() => onEdit(cls)}
                    className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-subtle)] hover:text-[var(--color-primary)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    data-testid="btn-delete-class"
                    aria-label={`Excluir ${cls.description}`}
                    onClick={() => onDelete(cls)}
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
      data-testid="classes-empty-state"
      className="flex flex-col items-center justify-center py-16 gap-4 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-[var(--color-primary-subtle)] flex items-center justify-center">
        <BookOpen className="text-[var(--color-primary)]" size={28} />
      </div>
      <div>
        <p className="text-base font-medium text-[var(--color-text-primary)]">Nenhuma turma cadastrada</p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Adicione a primeira turma para começar.</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
      >
        <Plus size={16} />
        Nova Turma
      </button>
    </div>
  );
}
