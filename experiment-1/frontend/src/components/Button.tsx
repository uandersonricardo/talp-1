import { forwardRef } from "react";

import Spinner from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "outlined" | "ghost" | "danger";
  size?: "compact" | "default";
  loading?: boolean;
  icon?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "filled", size = "default", loading = false, disabled, icon, children, className = "", ...props },
    ref,
  ) => {
    const base =
      "inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";
    const sz = size === "compact" ? "h-9 px-3 text-sm" : "h-10 px-4 text-sm";
    const focus = "focus-visible:outline-[var(--color-primary)]";

    const variants: Record<string, string> = {
      filled:
        "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-hover)]",
      outlined:
        "border border-[var(--color-outline)] text-[var(--color-on-surface)] bg-transparent hover:bg-[var(--color-surface-container)]",
      ghost: "text-[var(--color-on-surface)] bg-transparent hover:bg-[var(--color-surface-container)]",
      danger:
        "border border-[var(--color-error)] text-[var(--color-error)] bg-transparent hover:bg-[var(--color-error-surface)]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${sz} ${focus} ${variants[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <Spinner size={16} />
        ) : (
          <>
            {icon && (
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                {icon}
              </span>
            )}
            {children}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
