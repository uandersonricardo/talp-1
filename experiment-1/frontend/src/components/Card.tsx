interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: "sm" | "md";
}

export default function Card({ children, className = "", onClick, padding = "md" }: CardProps) {
  const base =
    "bg-[var(--color-surface)] border border-[var(--color-outline)] rounded-xl transition-colors duration-150";
  const paddings = { sm: "p-4", md: "p-6" };
  const interactive = onClick ? "cursor-pointer hover:bg-[var(--color-surface-container)]" : "";

  return (
    <div className={`${base} ${paddings[padding]} ${interactive} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
