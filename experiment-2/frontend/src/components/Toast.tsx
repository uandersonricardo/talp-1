import { X } from "lucide-react";
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  addToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro do ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <ToastNotification key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastNotification({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const borderClass = {
    success: "border-l-green-500",
    error: "border-l-[var(--color-destructive)]",
    info: "border-l-[var(--color-primary)]",
  }[toast.variant];

  return (
    <div
      data-testid="toast"
      data-variant={toast.variant}
      className={`flex items-start justify-between gap-3 w-80 bg-[var(--color-surface)] rounded-xl shadow-lg px-4 py-3 border-l-4 ${borderClass} animate-toast-in`}
    >
      <p className="text-sm text-[var(--color-text-primary)] flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        aria-label="Fechar notificação"
        className="shrink-0 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-0.5 rounded transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)]"
      >
        <X size={14} />
      </button>
    </div>
  );
}
