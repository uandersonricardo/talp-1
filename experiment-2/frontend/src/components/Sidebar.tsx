import { BookOpen, Target, User, UserCircle2 } from "lucide-react";
import { NavLink } from "react-router";

const NAV_ITEMS = [
  { to: "/alunos", label: "Alunos", icon: User },
  { to: "/turmas", label: "Turmas", icon: BookOpen },
  { to: "/metas", label: "Metas", icon: Target },
] as const;

export function Sidebar() {
  return (
    <aside
      data-testid="sidebar"
      className="hidden lg:flex flex-col w-60 shrink-0 h-screen fixed left-0 top-0 bg-[var(--color-surface-variant)] border-r border-[var(--color-border)]"
    >
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--color-border)]">
        <UserCircle2 className="text-[var(--color-primary)]" size={20} />
        <span className="text-base font-semibold text-[var(--color-text-primary)]">Gestão de Alunos</span>
      </div>
      <nav className="flex-1 p-3" aria-label="Navegação principal">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-colors duration-100 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary)] ${
                    isActive
                      ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-subtle)] hover:text-[var(--color-text-primary)]"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
