import { BookOpen, Target, User } from "lucide-react";
import { NavLink } from "react-router";

const NAV_ITEMS = [
  { to: "/alunos", label: "Alunos", icon: User },
  { to: "/turmas", label: "Turmas", icon: BookOpen },
  { to: "/metas", label: "Metas", icon: Target },
] as const;

export function BottomNav() {
  return (
    <nav
      data-testid="bottom-nav"
      aria-label="Navegação principal"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex z-40"
    >
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-3 gap-1 text-xs font-medium transition-colors duration-100 focus:outline-2 focus:outline-[var(--color-primary)] ${
              isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]"
            }`
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
