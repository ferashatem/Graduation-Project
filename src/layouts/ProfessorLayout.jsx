import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { fetchMyProfile } from "../features/professor/api/professorBackendApi";
import ProfessorSidebar from "../components/professor/ProfessorSidebar";
import ProfessorTopbar from "../components/professor/ProfessorTopbar";
import { getStoredAccessToken } from "../auth/session";

function ProfessorLayout() {
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!getStoredAccessToken()) {
        if (active) { setProfile(null); setProfileLoading(false); }
        return;
      }
      setProfileLoading(true);
      try {
        const data = await fetchMyProfile();
        if (active) setProfile(data ?? null);
      } catch {
        if (active) setProfile(null);
      } finally {
        if (active) setProfileLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, []);

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/prof/courses/")) return "Course Details";
    if (path.startsWith("/prof/courses")) return "Courses";
    if (path.startsWith("/prof/quizzes/") && path.endsWith("/results")) return "Quiz Results";
    if (path.startsWith("/prof/quizzes")) return "Quizzes";
    if (path.startsWith("/prof/chat")) return "AI Assistant";
    if (path === "/prof" || path === "/prof/") return "Professor Home";
    return "Professor";
  }, [location.pathname]);

  const handleMenuClick = useCallback(() => setSidebarOpen((p) => !p), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);

  // Expose a stable user-like object from the backend profile so child pages
  // that still reference user.uid gracefully receive the profile's id.
  const user = useMemo(
    () => (profile ? { uid: profile.id ?? profile.userId ?? profile.code, ...profile } : null),
    [profile]
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ProfessorSidebar
        open={sidebarOpen}
        onClose={handleCloseSidebar}
        onNavigate={handleCloseSidebar}
        profile={profile}
        user={user}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <ProfessorTopbar
          title={pageTitle}
          profile={profile}
          user={user}
          onMenuClick={handleMenuClick}
        />
        <main className="flex-1 overflow-y-auto p-4 ipad-portrait:p-6 ipad-pro-portrait:p-8">
          <Outlet context={{ user, profile, profileLoading }} />
        </main>
      </div>
    </div>
  );
}

export default ProfessorLayout;
