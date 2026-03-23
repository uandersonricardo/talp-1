import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import Layout from "./components/Layout";
import { ToastProvider } from "./components/Toast";
import ExamDetailPage from "./pages/ExamDetailPage";
import ExamFormPage from "./pages/ExamFormPage";
import ExamsPage from "./pages/ExamsPage";
import GradingPage from "./pages/GradingPage";
import QuestionFormPage from "./pages/QuestionFormPage";
import QuestionsPage from "./pages/QuestionsPage";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/questions" replace />} />
            <Route path="/questions" element={<QuestionsPage />} />
            <Route path="/questions/new" element={<QuestionFormPage />} />
            <Route path="/questions/:id/edit" element={<QuestionFormPage />} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/exams/new" element={<ExamFormPage />} />
            <Route path="/exams/:id" element={<ExamDetailPage />} />
            <Route path="/exams/:id/edit" element={<ExamFormPage />} />
            <Route path="/grade" element={<GradingPage />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  );
}
