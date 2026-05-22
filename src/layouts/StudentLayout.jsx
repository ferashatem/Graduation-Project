import { useCallback, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuthUser } from "../auth/useAuthUser";
import StudentSidebar from "../components/student/StudentSidebar";
import StudentTopbar from "../components/student/StudentTopbar";

function StudentLayout() {
  const { user, authLoading } = useAuthUser();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Profile built from localStorage — no Firestore needed
  const profile = useMemo(() => {
    if (!user) return null;
    return {
      fullName: user.displayName || "",
      email:    user.email       || "",
      id:       user.uid         || "",
    };
  }, [user]);

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/student/courses")) return "My Courses";
    if (path.includes("/student/quizzes/") && path.endsWith("/result")) return "Quiz Result";
    if (path.includes("/student/quizzes/")) return "Take Quiz";
    if (path.startsWith("/student/quizzes")) return "Quizzes";
    if (path.startsWith("/student/complaints")) return "My Complaints";
    if (path === "/student" || path === "/student/") return "Home";
    return "Student";
  }, [location.pathname]);

  const handleMenuClick   = useCallback(() => setSidebarOpen((p) => !p), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex min-h-screen bg-gray-100">
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
  );
}

export default StudentLayout;
