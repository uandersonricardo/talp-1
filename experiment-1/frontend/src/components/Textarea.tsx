import { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helper, id, className = "", ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[var(--color-on-surface-muted)] uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`min-h-[96px] px-4 py-3 rounded-lg border text-sm bg-[var(--color-surface-container)] text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-muted)] transition-colors duration-100 resize-y
            ${error ? "border-[var(--color-error)]" : "border-[var(--color-outline)]"}
            focus:outline-none focus:border-[var(--color-outline-focus)]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
        {!error && helper && <p className="text-xs text-[var(--color-on-surface-muted)]">{helper}</p>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
