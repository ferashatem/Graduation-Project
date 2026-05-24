import { useCallback, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuthUser } from "../../auth/useAuthUser";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopbar from "../../components/admin/AdminTopbar";
import { NotificationProvider } from "../../context/NotificationContext";

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
  const { user, profile, authLoading } = useAuthUser();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = useMemo(
    () => resolveTitle(location.pathname),
    [location.pathname]
  );

  const handleMenuClick = useCallback(() => setSidebarOpen((p) => !p), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <NotificationProvider>
    <div className="flex h-screen overflow-hidden bg-slate-50">
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
          <Outlet context={{ user, profile, profileLoading: authLoading }} />
        </main>
      </div>
    </div>
    </NotificationProvider>
  );
}

export default MainLayoutSuperAdmin;
