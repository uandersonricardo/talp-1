import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Excluir",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      testId="confirm-dialog"
      footer={
        <>
          <button
            type="button"
            data-testid="btn-cancel-confirm"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-variant)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            data-testid="btn-confirm-delete"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium rounded-lg text-[var(--color-destructive)] hover:bg-[var(--color-destructive-subtle)] transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-destructive)]"
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-[var(--color-destructive)] shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
      </div>
    </Modal>
  );
}
