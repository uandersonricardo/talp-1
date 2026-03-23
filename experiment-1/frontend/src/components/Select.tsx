import { forwardRef } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helper, id, options, className = "", ...props }, ref) => {
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
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={`w-full h-10 pl-4 pr-10 rounded-lg border text-sm bg-[var(--color-surface-container)] text-[var(--color-on-surface)] appearance-none cursor-pointer transition-colors duration-100
              ${error ? "border-[var(--color-error)]" : "border-[var(--color-outline)]"}
              focus:outline-none focus:border-[var(--color-outline-focus)]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span
            className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-on-surface-muted)]"
            style={{ fontSize: 18 }}
          >
            expand_more
          </span>
        </div>
        {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
        {!error && helper && <p className="text-xs text-[var(--color-on-surface-muted)]">{helper}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
