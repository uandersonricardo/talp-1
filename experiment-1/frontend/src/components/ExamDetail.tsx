import type { Exam } from "../types";

interface ExamDetailProps {
  exam: Exam;
}

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return d;
  }
};

export default function ExamDetail({ exam }: ExamDetailProps) {
  const fields: { label: string; value: string }[] = [
    { label: "Title", value: exam.title },
    { label: "Course", value: exam.course },
    { label: "Professor", value: exam.professor },
    { label: "Date", value: formatDate(exam.date) },
    {
      label: "Identifier mode",
      value: exam.identifierMode === "letters" ? "Letters (A, B, C…)" : "Powers (1, 2, 4, 8…)",
    },
    { label: "Questions", value: `${exam.questions.length} question${exam.questions.length !== 1 ? "s" : ""}` },
  ];

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      {fields.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide mb-0.5">
            {label}
          </dt>
          <dd className="text-sm text-[var(--color-on-surface)]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
