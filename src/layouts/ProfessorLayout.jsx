import { useCallback, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import ProfessorSidebar from "../components/professor/ProfessorSidebar";
import ProfessorTopbar from "../components/professor/ProfessorTopbar";
import { NotificationProvider } from "../context/NotificationContext";
import { useAuthUser } from "../auth/useAuthUser";

function ProfessorLayout() {
  const location = useLocation();
  const { user, profile, authLoading } = useAuthUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/prof/courses/")) return "Course Details";
    if (path.startsWith("/prof/courses")) return "Courses";
    if (path.startsWith("/prof/quizzes/") && path.endsWith("/results")) return "Quiz Results";
    if (path.startsWith("/prof/quizzes")) return "Quizzes";
    if (path.includes("/prof/exams/") && path.endsWith("/analytics")) return "Exam Analytics";
    if (path.includes("/prof/exams/") && path.endsWith("/results")) return "Exam Results";
    if (path.startsWith("/prof/exams")) return "My Exams";
    if (path.startsWith("/prof/chat")) return "AI Assistant";
    if (path === "/prof" || path === "/prof/") return "Professor Home";
    return "Professor";
  }, [location.pathname]);

  const handleMenuClick = useCallback(() => setSidebarOpen((p) => !p), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <NotificationProvider>
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <ProfessorSidebar
        open={sidebarOpen}
        onClose={handleCloseSidebar}
        onNavigate={handleCloseSidebar}
        profile={profile}
        user={user}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {location.pathname.startsWith("/prof/chat") ? null : (
          <ProfessorTopbar
            title={pageTitle}
            profile={profile}
            user={user}
            onMenuClick={handleMenuClick}
          />
        )}
        <main
          className={
            location.pathname.startsWith("/prof/chat")
              ? "flex-1 overflow-hidden"
              : "flex-1 overflow-y-auto p-4 ipad-portrait:p-6 ipad-pro-portrait:p-8"
          }
        >
          <Outlet context={{ user, profile, profileLoading: authLoading }} />
        </main>
      </div>
    </div>
    </NotificationProvider>
  );
}

export default ProfessorLayout;
