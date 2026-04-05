import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuthUser } from "../auth/useAuthUser";
import { getProfessorProfile } from "../firebase/professorApi";
import { getCollegeById } from "../firebase/firestoreColleges";
import ProfessorSidebar from "../components/professor/ProfessorSidebar";
import ProfessorTopbar from "../components/professor/ProfessorTopbar";

function ProfessorLayout() {
  const { user, authLoading } = useAuthUser();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      if (!user?.uid) {
        if (isActive) {
          setProfile(null);
          setProfileLoading(false);
        }
        return;
      }

      setProfileLoading(true);

      try {
        const nextProfile = await getProfessorProfile(user.uid);
        if (nextProfile && (nextProfile.collegeId || nextProfile.college)) {
          const collegeDoc = await getCollegeById(nextProfile.collegeId || nextProfile.college).catch(() => null);
          if (collegeDoc?.name) nextProfile.collegeName = collegeDoc.name;
        }
        if (isActive) setProfile(nextProfile);
      } catch (err) {
        if (isActive) setProfile(null);
      } finally {
        if (isActive) setProfileLoading(false);
      }
    };

    if (!authLoading) {
      loadProfile();
    }

    return () => {
      isActive = false;
    };
  }, [authLoading, user?.uid]);

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/prof/courses/")) return "Course Details";
    if (path.startsWith("/prof/courses")) return "Courses";
    if (path.startsWith("/prof/quizzes/") && path.endsWith("/results")) return "Quiz Results";
    if (path.startsWith("/prof/quizzes")) return "Quizzes";
    if (path === "/prof" || path === "/prof/") return "Professor Home";
    return "Professor";
  }, [location.pathname]);

  const handleMenuClick = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

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
