import { useCallback, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "../auth/useAuthUser";
import StudentSidebar from "../components/student/StudentSidebar";
import StudentTopbar from "../components/student/StudentTopbar";
import { NotificationProvider } from "../context/NotificationContext";

function StudentLayout() {
  const { user, profile: meProfile, authLoading } = useAuthUser();
  const location = useLocation();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Prefer the rich /auth/me profile; fall back to a shim built from user fields.
  const profile = useMemo(() => {
    if (meProfile) return meProfile;
    if (!user) return null;
    return {
      fullName: user.displayName || "",
      email:    user.email       || "",
      id:       user.uid         || "",
    };
  }, [meProfile, user]);

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/student/courses")) return t("studentNav.myCourses");
    if (path.includes("/student/quizzes/") && path.endsWith("/result")) return t("studentNav.quizResult");
    if (path.includes("/student/quizzes/")) return t("studentNav.takeQuiz");
    if (path.startsWith("/student/quizzes")) return t("studentNav.quizzes");
    if (path.startsWith("/student/complaints")) return t("studentNav.myComplaints");
    if (path === "/student" || path === "/student/") return t("studentNav.home");
    return t("studentNav.role");
  }, [location.pathname, t]);

  const handleMenuClick   = useCallback(() => setSidebarOpen((p) => !p), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <NotificationProvider>
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <StudentSidebar
        open={sidebarOpen}
        onClose={handleCloseSidebar}
        onNavigate={handleCloseSidebar}
        profile={profile}
        user={user}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <StudentTopbar
          title={pageTitle}
          profile={profile}
          user={user}
          onMenuClick={handleMenuClick}
        />
        <main className="flex-1 overflow-y-auto p-4 ipad-portrait:p-6 ipad-pro-portrait:p-8">
          <Outlet context={{ user, profile, profileLoading: authLoading }} />
        </main>
      </div>
    </div>
    </NotificationProvider>
  );
}

export default StudentLayout;
