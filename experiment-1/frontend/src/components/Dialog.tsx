import { useEffect, useRef } from "react";

import Button from "./Button";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Dialog({ open, onClose, title, description, children, actions }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    firstFocusRef.current?.focus();
    return () => {
      prev?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div ref={overlayRef} className="absolute inset-0 bg-black/32" onClick={onClose} aria-hidden="true" />
      <div
        className="relative w-full max-w-sm bg-[var(--color-surface)] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.16)] animate-[dialog-in_180ms_ease]"
        style={{
          animation: "dialog-in 180ms ease",
        }}
      >
        <style>{`
          @keyframes dialog-in {
            from { opacity: 0; transform: scale(0.95); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <div className="p-6">
          <h2 id="dialog-title" className="text-base font-medium text-[var(--color-on-surface)] mb-2">
            {title}
          </h2>
          {description && <p className="text-sm text-[var(--color-on-surface-muted)]">{description}</p>}
          {children}
        </div>
        {actions && <div className="flex justify-end gap-2 px-6 pb-4">{actions}</div>}
        {!actions && (
          <div className="flex justify-end gap-2 px-6 pb-4">
            <Button ref={firstFocusRef} variant="outlined" onClick={onClose}>
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Excluir",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      actions={
        <>
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
