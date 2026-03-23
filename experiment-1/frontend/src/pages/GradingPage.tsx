import GradingForm from "../components/GradingForm";
import { useToast } from "../hooks/useToast";

export default function GradingPage() {
  const { addToast } = useToast();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-medium leading-7 text-[var(--color-on-surface)]">Grading</h1>
        <p className="text-sm text-[var(--color-on-surface-muted)] mt-1">
          Upload an answer key and student responses CSV to generate a grading report.
        </p>
      </div>

      <GradingForm addToast={addToast} />
    </div>
  );
}
