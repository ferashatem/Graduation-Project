import { useCallback, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ProfessorSidebar from "../components/professor/ProfessorSidebar";
import ProfessorTopbar from "../components/professor/ProfessorTopbar";
import { NotificationProvider } from "../context/NotificationContext";
import { useAuthUser } from "../auth/useAuthUser";

function ProfessorLayout() {
  const location = useLocation();
  const { t } = useTranslation();
  const { user, profile, authLoading } = useAuthUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/prof/courses/")) return t("profNav.courseDetails");
    if (path.startsWith("/prof/courses")) return t("profNav.courses");
    if (path.startsWith("/prof/quizzes/") && path.endsWith("/results")) return t("profNav.quizResults");
    if (path.startsWith("/prof/quizzes")) return t("profNav.quizzes");
    if (path.includes("/prof/exams/") && path.endsWith("/analytics")) return t("profNav.examAnalytics");
    if (path.includes("/prof/exams/") && path.endsWith("/results")) return t("profNav.examResults");
    if (path.startsWith("/prof/exams")) return t("profNav.myExams");
    if (path.startsWith("/prof/chat")) return t("profNav.aiAssistant");
    if (path === "/prof" || path === "/prof/") return t("profNav.professorHome");
    return t("profNav.role");
  }, [location.pathname, t]);

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
