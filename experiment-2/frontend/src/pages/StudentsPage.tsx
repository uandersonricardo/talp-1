import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, User } from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { createStudent, deleteStudent, listStudents, updateStudent } from "../requests/students";
import type { Student } from "../types";

interface StudentForm {
  name: string;
  cpf: string;
  email: string;
}

type FormErrors = Partial<Record<keyof StudentForm, string>>;

const EMPTY_FORM: StudentForm = { name: "", cpf: "", email: "" };

function validateForm(form: StudentForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Nome é obrigatório";
  const digits = form.cpf.replace(/\D/g, "");
  if (!digits) {
    errors.cpf = "CPF é obrigatório";
  } else if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
    errors.cpf = "CPF inválido";
  }
  if (!form.email.trim()) {
    errors.email = "E-mail é obrigatório";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "E-mail inválido";
  }
  return errors;
}

function formatCPF(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function StudentsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const {
    data: students = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["students"],
    queryFn: listStudents,
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Student, "id">) => createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      closeModal();
      addToast("Aluno criado com sucesso", "success");
    },
    onError: (err: Error) => addToast(err.message, "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<Student, "id"> }) => updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      closeModal();
      addToast("Aluno atualizado com sucesso", "success");
    },
    onError: (err: Error) => addToast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setConfirmDelete(null);
      addToast("Aluno removido com sucesso", "success");
    },
    onError: (err: Error) => addToast(err.message, "error"),
  });

  function openCreate() {
    setEditingStudent(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(student: Student) {
    setEditingStudent(student);
    setForm({ name: student.name, cpf: student.cpf, email: student.email });
    setErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingStudent(null);
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
    const data = { name: form.name.trim(), cpf: form.cpf, email: form.email.trim() };
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function handleCPFChange(e: ChangeEvent<HTMLInputElement>) {
    const formatted = formatCPF(e.target.value);
    setForm((prev) => ({ ...prev, cpf: formatted }));
    if (errors.cpf) setErrors((prev) => ({ ...prev, cpf: undefined }));
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div data-testid="students-page" className="p-6 lg:p-8 pb-24 lg:pb-8">
      {/* Cabeçalho da página */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Alunos</h1>
        <button
          type="button"
          data-testid="btn-new-student"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Novo Aluno</span>
        </button>
      </div>

      {/* Conteúdo */}
      {isLoading && <p className="text-sm text-[var(--color-text-secondary)]">Carregando alunos...</p>}

      {isError && (
        <p className="text-sm text-[var(--color-destructive)]">Erro ao carregar os alunos. Tente novamente.</p>
      )}

      {!isLoading && !isError && students.length === 0 && <EmptyState onAdd={openCreate} />}

      {!isLoading && !isError && students.length > 0 && (
        <StudentsTable students={students} onEdit={openEdit} onDelete={setConfirmDelete} />
      )}

      {/* Modal Criar / Editar */}
      <Modal
        open={modalOpen}
        title={editingStudent ? "Editar Aluno" : "Novo Aluno"}
        onClose={closeModal}
        testId="student-modal"
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
              form="student-form"
              data-testid="btn-save-student"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-text-disabled)] disabled:cursor-not-allowed transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
          </>
        }
      >
        <form id="student-form" data-testid="student-form" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <Field
              id="student-name"
              testId="student-name-input"
              label="Nome"
              type="text"
              value={form.name}
              placeholder="Nome completo"
              error={errors.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
            />
            <Field
              id="student-cpf"
              testId="student-cpf-input"
              label="CPF"
              type="text"
              value={form.cpf}
              placeholder="000.000.000-00"
              error={errors.cpf}
              inputMode="numeric"
              onChange={handleCPFChange}
            />
            <Field
              id="student-email"
              testId="student-email-input"
              label="E-mail"
              type="email"
              value={form.email}
              placeholder="aluno@email.com"
              error={errors.email}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, email: e.target.value }));
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
            />
          </div>
        </form>
      </Modal>

      {/* Confirmação de exclusão */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Excluir Aluno"
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

// ─── StudentsTable ────────────────────────────────────────────────────────────

interface StudentsTableProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

function StudentsTable({ students, onEdit, onDelete }: StudentsTableProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden overflow-x-auto">
      <table data-testid="students-table" className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--color-surface-variant)]">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
              Nome
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
              CPF
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
              E-mail
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student.id}
              data-testid="student-row"
              data-student-id={student.id}
              className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-variant)] transition-colors duration-100"
            >
              <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{student.name}</td>
              <td className="px-4 py-3 font-mono text-[var(--color-text-secondary)]">{student.cpf}</td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">{student.email}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    data-testid="btn-edit-student"
                    aria-label={`Editar ${student.name}`}
                    onClick={() => onEdit(student)}
                    className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-subtle)] hover:text-[var(--color-primary)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    data-testid="btn-delete-student"
                    aria-label={`Excluir ${student.name}`}
                    onClick={() => onDelete(student)}
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
      data-testid="students-empty-state"
      className="flex flex-col items-center justify-center py-16 gap-4 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-[var(--color-primary-subtle)] flex items-center justify-center">
        <User className="text-[var(--color-primary)]" size={28} />
      </div>
      <div>
        <p className="text-base font-medium text-[var(--color-text-primary)]">Nenhum aluno cadastrado</p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Adicione o primeiro aluno para começar.</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
      >
        <Plus size={16} />
        Novo Aluno
      </button>
    </div>
  );
}
