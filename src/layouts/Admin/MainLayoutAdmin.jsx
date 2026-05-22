import { useCallback, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuthUser } from "../../auth/useAuthUser";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopbar from "../../components/admin/AdminTopbar";
import { NotificationProvider } from "../../context/NotificationContext";

const PAGE_TITLES = [
  ["/admin/campus-buildings", "Campus Buildings"],
  ["/admin/bulk-import-users", "Bulk Import Users"],
  ["/admin/create-admin", "User Management"],
  ["/admin/assignments/new", "New Assignment"],
  ["/admin/assignments", "Assignments"],
  ["/admin/colleges", "Academic Structure"],
  ["/admin/home", "Home"],
  ["/admin", "Admin Dashboard"],
  ["/offerings", "Offerings"],
  ["/sessions", "Sessions"],
];

function resolveTitle(pathname) {
  for (const [prefix, label] of PAGE_TITLES) {
    if (pathname.startsWith(prefix)) return label;
  }
  return "Admin";
}

function MainLayoutAdmin() {
  const { user } = useAuthUser();
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

  const pageTitle = useMemo(() => resolveTitle(location.pathname), [location.pathname]);

  const handleMenuClick    = useCallback(() => setSidebarOpen((p) => !p), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <NotificationProvider>
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar
        open={sidebarOpen}
        onClose={handleCloseSidebar}
        onNavigate={handleCloseSidebar}
        profile={profile}
        user={user}
        role="admin"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          title={pageTitle}
          profile={profile}
          user={user}
          onMenuClick={handleMenuClick}
          role="admin"
        />
        <main className="flex-1 overflow-y-auto p-4 ipad-portrait:p-6 ipad-pro-portrait:p-8">
          <Outlet context={{ user, profile, profileLoading: false }} />
        </main>
      </div>
    </div>
    </NotificationProvider>
  );
}

export default MainLayoutAdmin;
