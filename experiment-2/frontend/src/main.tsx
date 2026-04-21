import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { BottomNav } from "./components/BottomNav";
import { Sidebar } from "./components/Sidebar";
import { ToastProvider } from "./components/Toast";
import { ClassDetailPage } from "./pages/ClassDetailPage";
import { ClassesPage } from "./pages/ClassesPage";
import { GoalsPage } from "./pages/GoalsPage";
import { StudentsPage } from "./pages/StudentsPage";
import "./styles/main.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function App() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex">
      <Sidebar />
      <main className="flex-1 lg:ml-60 min-w-0">
        <div className="max-w-[1200px] mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/alunos" replace />} />
            <Route path="/alunos" element={<StudentsPage />} />
            <Route path="/turmas" element={<ClassesPage />} />
            <Route path="/turmas/:id" element={<ClassDetailPage />} />
            <Route path="/metas" element={<GoalsPage />} />
          </Routes>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </QueryClientProvider>,
);
