import { type Toast, ToastContext, useToastState } from "../hooks/useToast";

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons: Record<Toast["variant"], string> = {
    success: "check_circle",
    error: "error",
    info: "info",
  };

  const colors: Record<Toast["variant"], string> = {
    success: "text-[var(--color-success)]",
    error: "text-[var(--color-error)]",
    info: "text-[var(--color-primary)]",
  };

  return (
    <div
      className="toast-enter flex items-center gap-3 bg-[var(--color-on-surface)] text-[var(--color-surface)] rounded-xl px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.24)] min-w-[280px] max-w-[400px]"
      role="status"
      aria-live="polite"
    >
      <span className={`material-symbols-rounded shrink-0 ${colors[toast.variant]}`} style={{ fontSize: 20 }}>
        {icons[toast.variant]}
      </span>
      <p className="text-sm flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
          close
        </span>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastState();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const state = useToastState();

  return (
    <ToastContext.Provider value={state}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:bottom-6 sm:right-6"
        aria-live="polite"
        aria-atomic="true"
      >
        {state.toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={state.removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
