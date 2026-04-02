import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuthUser } from "../../auth/useAuthUser";
import { getProfessorProfile } from "../../firebase/professorApi";
import { getCollegeById } from "../../firebase/firestoreColleges";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopbar from "../../components/admin/AdminTopbar";

const PAGE_TITLES = [
  ["/super_admin/bulk-import-users", "Bulk Import Users"],
  ["/super_admin/create-admin", "User Management"],
  ["/super_admin/home", "Home"],
  ["/super_admin", "Super Admin Dashboard"],
  ["/sessions", "Sessions"],
];

function resolveTitle(pathname) {
  for (const [prefix, label] of PAGE_TITLES) {
    if (pathname.startsWith(prefix)) return label;
  }
  return "Super Admin";
}

function MainLayoutSuperAdmin() {
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
        const nextProfile = await getProfessorProfile(user.uid);
        if (nextProfile && (nextProfile.collegeId || nextProfile.college)) {
          const collegeDoc = await getCollegeById(
            nextProfile.collegeId || nextProfile.college
          ).catch(() => null);
          if (collegeDoc?.name) nextProfile.collegeName = collegeDoc.name;
        }
        if (isActive) setProfile(nextProfile);
      } catch {
        if (isActive) setProfile(null);
      } finally {
        if (isActive) setProfileLoading(false);
      }
    };

    if (!authLoading) loadProfile();
    return () => { isActive = false; };
  }, [authLoading, user?.uid]);

  const pageTitle = useMemo(
    () => resolveTitle(location.pathname),
    [location.pathname]
  );

  const handleMenuClick = useCallback(() => setSidebarOpen((p) => !p), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar
        open={sidebarOpen}
        onClose={handleCloseSidebar}
        onNavigate={handleCloseSidebar}
        profile={profile}
        user={user}
        role="super_admin"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          title={pageTitle}
          profile={profile}
          user={user}
          onMenuClick={handleMenuClick}
          role="super_admin"
        />
        <main className="flex-1 overflow-y-auto p-4 ipad-portrait:p-6 ipad-pro-portrait:p-8">
          <Outlet context={{ user, profile, profileLoading }} />
        </main>
      </div>
    </div>
  );
}

export default MainLayoutSuperAdmin;
