interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon = "inbox", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <span
        className="material-symbols-rounded text-[var(--color-on-surface-muted)]"
        style={{ fontSize: 48 }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="flex flex-col gap-1 max-w-sm">
        <p className="text-xl font-medium text-[var(--color-on-surface)]">{title}</p>
        {description && <p className="text-sm text-[var(--color-on-surface-muted)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
