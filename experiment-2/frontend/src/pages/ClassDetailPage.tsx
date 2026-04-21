import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ClipboardList, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { enrollStudent, listClasses, listEvaluations, unenrollStudent, upsertEvaluation } from "../requests/classes";
import { listGoals } from "../requests/goals";
import { listStudents } from "../requests/students";
import type { Evaluation, Goal, Grade, Student } from "../types";

// ─── Grade styles ─────────────────────────────────────────────────────────────

const GRADE_STYLES: Record<Grade, { bg: string; text: string; label: string }> = {
  MA: { bg: "#E6F4EA", text: "#1E7E34", label: "MA" },
  MPA: { bg: "#FEF7E0", text: "#B45309", label: "MPA" },
  MANA: { bg: "#FDECEA", text: "#B71C1C", label: "MANA" },
};

const GRADES: Grade[] = ["MA", "MPA", "MANA"];

// ─── ClassDetailPage ──────────────────────────────────────────────────────────

interface GradeModalState {
  studentId: string;
  goalId: string;
  studentName: string;
  goalName: string;
  currentGrade: Grade | null;
}

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [confirmUnenroll, setConfirmUnenroll] = useState<Student | null>(null);
  const [gradeModal, setGradeModal] = useState<GradeModalState | null>(null);

  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: listClasses });
  const studentsQuery = useQuery({ queryKey: ["students"], queryFn: listStudents });
  const goalsQuery = useQuery({ queryKey: ["goals"], queryFn: listGoals });
  const evaluationsQuery = useQuery({
    queryKey: ["evaluations", id],
    queryFn: () => listEvaluations(id!),
    enabled: !!id,
  });

  const enrollMutation = useMutation({
    mutationFn: (studentId: string) => enrollStudent(id!, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      addToast("Aluno matriculado com sucesso", "success");
    },
    onError: (err: Error) => addToast(err.message, "error"),
  });

  const unenrollMutation = useMutation({
    mutationFn: (studentId: string) => unenrollStudent(id!, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setConfirmUnenroll(null);
      addToast("Aluno removido da turma", "success");
    },
    onError: (err: Error) => addToast(err.message, "error"),
  });

  const upsertEvalMutation = useMutation({
    mutationFn: (data: { studentId: string; goalId: string; grade: Grade }) => upsertEvaluation(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations", id] });
      setGradeModal(null);
      addToast("Avaliação salva", "success");
    },
    onError: (err: Error) => addToast(err.message, "error"),
  });

  const isLoading =
    classesQuery.isLoading || studentsQuery.isLoading || goalsQuery.isLoading || evaluationsQuery.isLoading;
  const isError =
    classesQuery.isError || studentsQuery.isError || goalsQuery.isError || evaluationsQuery.isError;

  const cls = classesQuery.data?.find((c) => c.id === id);

  if (!isLoading && !isError && !cls) {
    return (
      <div className="p-6 lg:p-8">
        <Link
          to="/turmas"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-100 mb-4"
        >
          <ChevronLeft size={16} />
          Turmas
        </Link>
        <p className="text-sm text-[var(--color-destructive)]">Turma não encontrada.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-sm text-[var(--color-text-secondary)]">Carregando...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 lg:p-8">
        <Link
          to="/turmas"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-100 mb-4"
        >
          <ChevronLeft size={16} />
          Turmas
        </Link>
        <p className="text-sm text-[var(--color-destructive)]">Erro ao carregar dados. Tente novamente.</p>
      </div>
    );
  }

  const allStudents = studentsQuery.data ?? [];
  const goals = goalsQuery.data ?? [];
  const evaluations = evaluationsQuery.data ?? [];

  const enrolledStudents = allStudents.filter((s) => cls!.studentIds.includes(s.id));
  const unenrolledStudents = allStudents.filter((s) => !cls!.studentIds.includes(s.id));

  const evaluationMap = new Map<string, Evaluation>();
  for (const e of evaluations) {
    evaluationMap.set(`${e.studentId}:${e.goalId}`, e);
  }

  function openGradeModal(student: Student, goal: Goal) {
    const current = evaluationMap.get(`${student.id}:${goal.id}`);
    setGradeModal({
      studentId: student.id,
      goalId: goal.id,
      studentName: student.name,
      goalName: goal.name,
      currentGrade: current?.grade ?? null,
    });
  }

  return (
    <div data-testid="class-detail-page" className="p-6 lg:p-8 pb-24 lg:pb-8">
      {/* Cabeçalho */}
      <div className="mb-6">
        <Link
          to="/turmas"
          data-testid="btn-back"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-100 mb-3 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)] rounded"
        >
          <ChevronLeft size={16} />
          Turmas
        </Link>
        <h1
          data-testid="class-title"
          className="text-xl font-semibold text-[var(--color-text-primary)]"
        >
          {cls!.description}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {cls!.year} — {cls!.semester}º Semestre
        </p>
      </div>

      {/* Seção: Alunos Matriculados */}
      <section data-testid="enrolled-students-section" className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Alunos Matriculados</h2>
          <button
            type="button"
            data-testid="btn-add-student"
            onClick={() => setAddStudentModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
          >
            <UserPlus size={15} />
            <span className="hidden sm:inline">Matricular Aluno</span>
          </button>
        </div>

        {enrolledStudents.length === 0 ? (
          <EnrolledEmptyState onAdd={() => setAddStudentModalOpen(true)} />
        ) : (
          <EnrolledStudentsTable students={enrolledStudents} onUnenroll={setConfirmUnenroll} />
        )}
      </section>

      {/* Seção: Avaliações */}
      <section data-testid="evaluations-section">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">Avaliações</h2>

        {goals.length === 0 && (
          <p className="text-sm text-[var(--color-text-secondary)]">
            Nenhuma meta cadastrada. Adicione metas para registrar avaliações.
          </p>
        )}

        {goals.length > 0 && enrolledStudents.length === 0 && (
          <p className="text-sm text-[var(--color-text-secondary)]">
            Matricule alunos na turma para registrar avaliações.
          </p>
        )}

        {goals.length > 0 && enrolledStudents.length > 0 && (
          <EvaluationsTable
            students={enrolledStudents}
            goals={goals}
            evaluationMap={evaluationMap}
            onEditGrade={openGradeModal}
          />
        )}
      </section>

      {/* Modal: Adicionar Aluno */}
      <Modal
        open={addStudentModalOpen}
        title="Matricular Aluno"
        onClose={() => setAddStudentModalOpen(false)}
        testId="add-student-modal"
        maxWidth="sm"
        footer={
          <button
            type="button"
            data-testid="btn-confirm-enrollment"
            onClick={() => setAddStudentModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
          >
            Confirmar
          </button>
        }
      >
        {unenrolledStudents.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)] py-2">
            Todos os alunos já estão matriculados nesta turma.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-border)]">
            {unenrolledStudents.map((student) => (
              <li
                key={student.id}
                data-testid="available-student-item"
                data-student-id={student.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{student.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{student.email}</p>
                </div>
                <button
                  type="button"
                  data-testid="btn-enroll-student"
                  aria-label={`Matricular ${student.name}`}
                  disabled={enrollMutation.isPending}
                  onClick={() => enrollMutation.mutate(student.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-text-disabled)] disabled:cursor-not-allowed transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
                >
                  <UserPlus size={13} />
                  Matricular
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* Confirmação: Remover Aluno */}
      <ConfirmDialog
        open={confirmUnenroll !== null}
        title="Remover Aluno"
        message={`Remover "${confirmUnenroll?.name ?? ""}" desta turma? As avaliações registradas serão mantidas.`}
        confirmLabel="Remover"
        onConfirm={() => {
          if (confirmUnenroll) unenrollMutation.mutate(confirmUnenroll.id);
        }}
        onCancel={() => setConfirmUnenroll(null)}
      />

      {/* Modal: Selecionar Nota */}
      <Modal
        open={gradeModal !== null}
        title="Avaliar"
        onClose={() => setGradeModal(null)}
        testId="grade-modal"
        maxWidth="sm"
        footer={
          <button
            type="button"
            onClick={() => setGradeModal(null)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-variant)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
          >
            Cancelar
          </button>
        }
      >
        {gradeModal && (
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-0.5">{gradeModal.studentName}</p>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">{gradeModal.goalName}</p>
            <div data-testid="grade-selector" className="flex gap-2 flex-wrap">
              {GRADES.map((grade) => {
                const style = GRADE_STYLES[grade];
                const isSelected = gradeModal.currentGrade === grade;
                return (
                  <button
                    key={grade}
                    type="button"
                    data-testid={`grade-option-${grade}`}
                    disabled={upsertEvalMutation.isPending}
                    onClick={() =>
                      upsertEvalMutation.mutate({
                        studentId: gradeModal.studentId,
                        goalId: gradeModal.goalId,
                        grade,
                      })
                    }
                    style={
                      isSelected
                        ? { backgroundColor: style.bg, color: style.text, outline: `2px solid ${style.text}` }
                        : undefined
                    }
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-100 focus:outline-2 focus:outline-offset-2 disabled:cursor-not-allowed ${
                      isSelected
                        ? ""
                        : "bg-[var(--color-surface-variant)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                    }`}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── EnrolledStudentsTable ────────────────────────────────────────────────────

interface EnrolledStudentsTableProps {
  students: Student[];
  onUnenroll: (student: Student) => void;
}

function EnrolledStudentsTable({ students, onUnenroll }: EnrolledStudentsTableProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden overflow-x-auto">
      <table data-testid="enrolled-students-table" className="w-full text-sm">
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
              data-testid="enrolled-student-row"
              data-student-id={student.id}
              className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-variant)] transition-colors duration-100"
            >
              <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{student.name}</td>
              <td className="px-4 py-3 font-mono text-[var(--color-text-secondary)]">{student.cpf}</td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">{student.email}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    data-testid="btn-unenroll-student"
                    aria-label={`Remover ${student.name} da turma`}
                    onClick={() => onUnenroll(student)}
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

// ─── EvaluationsTable ─────────────────────────────────────────────────────────

interface EvaluationsTableProps {
  students: Student[];
  goals: Goal[];
  evaluationMap: Map<string, Evaluation>;
  onEditGrade: (student: Student, goal: Goal) => void;
}

function EvaluationsTable({ students, goals, evaluationMap, onEditGrade }: EvaluationsTableProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden overflow-x-auto">
      <table data-testid="evaluations-table" className="text-sm border-collapse">
        <thead>
          <tr className="bg-[var(--color-surface-variant)]">
            <th className="sticky left-0 z-10 bg-[var(--color-surface-variant)] px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)] whitespace-nowrap">
              Aluno
            </th>
            {goals.map((goal) => (
              <th
                key={goal.id}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)] whitespace-nowrap min-w-[120px]"
              >
                {goal.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student.id}
              className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-variant)] transition-colors duration-100"
            >
              <td className="sticky left-0 z-10 bg-[var(--color-surface)] px-4 py-3 font-medium text-[var(--color-text-primary)] whitespace-nowrap border-r border-[var(--color-border)]">
                {student.name}
              </td>
              {goals.map((goal) => {
                const evaluation = evaluationMap.get(`${student.id}:${goal.id}`);
                const grade = evaluation?.grade;
                const style = grade ? GRADE_STYLES[grade] : null;

                return (
                  <td key={goal.id} className="px-4 py-3">
                    <button
                      type="button"
                      data-testid="grade-cell"
                      data-student-id={student.id}
                      data-goal-id={goal.id}
                      aria-label={`Nota de ${student.name} em ${goal.name}: ${grade ?? "não avaliado"}`}
                      onClick={() => onEditGrade(student, goal)}
                      style={style ? { backgroundColor: style.bg, color: style.text } : undefined}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)] ${
                        style
                          ? ""
                          : "bg-[var(--color-surface-variant)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                      }`}
                    >
                      {grade ?? "—"}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── EnrolledEmptyState ───────────────────────────────────────────────────────

function EnrolledEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      data-testid="enrolled-empty-state"
      className="flex flex-col items-center justify-center py-10 gap-3 text-center rounded-xl border border-[var(--color-border)]"
    >
      <div className="w-12 h-12 rounded-full bg-[var(--color-primary-subtle)] flex items-center justify-center">
        <ClipboardList className="text-[var(--color-primary)]" size={22} />
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">Nenhum aluno matriculado</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Matricule alunos para registrar avaliações.</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
      >
        <UserPlus size={13} />
        Matricular Aluno
      </button>
    </div>
  );
}
