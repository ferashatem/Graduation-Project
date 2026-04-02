import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { useAuthUser } from "../auth/useAuthUser";
import { db } from "../firebase/firebaseConfig";
import StudentSidebar from "../components/student/StudentSidebar";
import StudentTopbar from "../components/student/StudentTopbar";

function StudentLayout() {
  const { user, authLoading } = useAuthUser();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      if (!user?.uid) {
        if (isActive) { setProfile(null); setProfileLoading(false); }
        return;
      }
      setProfileLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (isActive) setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch {
        if (isActive) setProfile(null);
      } finally {
        if (isActive) setProfileLoading(false);
      }
    };

    if (!authLoading) loadProfile();
    return () => { isActive = false; };
  }, [authLoading, user?.uid]);

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/student/courses")) return "My Courses";
    if (path === "/student" || path === "/student/") return "Home";
    return "Student";
  }, [location.pathname]);

  const handleMenuClick = useCallback(() => setSidebarOpen((prev) => !prev), []);
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
          <Outlet context={{ user, profile, profileLoading }} />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;
