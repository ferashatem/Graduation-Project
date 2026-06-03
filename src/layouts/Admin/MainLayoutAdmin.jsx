import { useCallback, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "../../auth/useAuthUser";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopbar from "../../components/admin/AdminTopbar";
import { NotificationProvider } from "../../context/NotificationContext";

function MainLayoutAdmin() {
  const { t } = useTranslation();
  const { user, profile: meProfile, authLoading } = useAuthUser();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const PAGE_TITLES = useMemo(() => [
    ["/admin/campus-buildings", t("pageTitles.academicStructure")],
    ["/admin/bulk-import-users", t("pageTitles.bulkImportUsers")],
    ["/admin/create-admin", t("pageTitles.userManagement")],
    ["/admin/assignments/new", t("pageTitles.newAssignment")],
    ["/admin/assignments", t("pageTitles.assignments")],
    ["/admin/colleges", t("pageTitles.academicStructure")],
    ["/admin/home", t("pageTitles.home")],
    ["/admin", t("pageTitles.adminDashboard")],
    ["/offerings", t("pageTitles.offerings")],
    ["/sessions", t("pageTitles.sessions")],
  ], [t]);

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
    for (const [prefix, label] of PAGE_TITLES) {
      if (location.pathname.startsWith(prefix)) return label;
    }
    return t("pageTitles.adminDashboard");
  }, [location.pathname, PAGE_TITLES, t]);

  const handleMenuClick    = useCallback(() => setSidebarOpen((p) => !p), []);
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
          <Outlet context={{ user, profile, profileLoading: authLoading }} />
        </main>
      </div>
    </div>
    </NotificationProvider>
  );
}

export default MainLayoutAdmin;
