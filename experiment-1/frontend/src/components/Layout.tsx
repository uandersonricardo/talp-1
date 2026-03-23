import { useState } from "react";
import { NavLink, useLocation } from "react-router";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Questions", path: "/questions", icon: "quiz" },
  { label: "Exams", path: "/exams", icon: "article" },
  { label: "Grading", path: "/grade", icon: "grading" },
];

function pageTitleFromPath(pathname: string): string {
  if (pathname.startsWith("/questions")) return "Questions";
  if (pathname.startsWith("/exams")) return "Exams";
  if (pathname.startsWith("/grade")) return "Grading";
  return "Exam Manager";
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100
            ${
              isActive
                ? "bg-[var(--color-primary-surface)] text-[var(--color-primary)]"
                : "text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)]"
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-6 bg-[var(--color-primary)] rounded-full" />
              )}
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
                {item.icon}
              </span>
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 fixed top-0 left-0 h-full bg-[var(--color-surface-dim)] border-r border-[var(--color-outline)] z-30">
      <div className="flex items-center gap-2 px-6 h-16 shrink-0">
        <span className="material-symbols-rounded text-[var(--color-primary)]" style={{ fontSize: 22 }}>
          school
        </span>
        <span className="text-base font-medium text-[var(--color-on-surface)]">Exam Manager</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <NavItems />
      </div>
    </aside>
  );
}

function MobileTopBar({ onMenuOpen }: { onMenuOpen: () => void }) {
  const location = useLocation();
  const title = pageTitleFromPath(location.pathname);

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--color-surface)] border-b border-[var(--color-outline)] z-30 flex items-center px-4 gap-3">
      <button
        onClick={onMenuOpen}
        aria-label="Open navigation menu"
        className="flex items-center justify-center w-10 h-10 -ml-2 rounded-lg hover:bg-[var(--color-surface-container)] transition-colors"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 22 }}>
          menu
        </span>
      </button>
      <span className="text-base font-medium text-[var(--color-on-surface)]">{title}</span>
    </header>
  );
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40" aria-hidden="true">
          <div className="absolute inset-0 bg-black/32" onClick={onClose} />
          <div
            className="absolute left-0 top-0 h-full w-72 bg-[var(--color-surface)] shadow-[0_8px_24px_rgba(0,0,0,0.16)] flex flex-col"
            style={{ animation: "slide-in 200ms cubic-bezier(0.2,0,0,1)" }}
          >
            <style>{`
              @keyframes slide-in {
                from { transform: translateX(-100%); }
                to   { transform: translateX(0); }
              }
            `}</style>
            <div className="flex items-center justify-between px-6 h-14 shrink-0 border-b border-[var(--color-outline)]">
              <span className="text-base font-medium text-[var(--color-on-surface)]">Exam Manager</span>
              <button
                onClick={onClose}
                aria-label="Close navigation menu"
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[var(--color-surface-container)] transition-colors"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
                  close
                </span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3">
              <NavItems onNavigate={onClose} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <MobileTopBar onMenuOpen={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
