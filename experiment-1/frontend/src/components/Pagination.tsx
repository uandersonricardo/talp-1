interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, total, limit, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
          chevron_left
        </span>
      </button>

      <span className="text-sm text-[var(--color-on-surface-muted)]">
        Page <strong className="text-[var(--color-on-surface)]">{page}</strong> of {totalPages}
      </span>

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
          chevron_right
        </span>
      </button>
    </div>
  );
}
