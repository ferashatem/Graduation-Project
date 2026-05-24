import { useCallback, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuthUser } from "../auth/useAuthUser";
import AssistantSidebar from "../components/assistant/AssistantSidebar";
import AssistantTopbar from "../components/assistant/AssistantTopbar";
import { NotificationProvider } from "../context/NotificationContext";

function AssistantLayout() {
  const { user, profile, authLoading } = useAuthUser();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/asst/courses/")) return "Course Details";
    if (path.startsWith("/asst/courses")) return "Courses";
    if (path === "/asst" || path === "/asst/") return "Assistant Home";
    return "Assistant";
  }, [location.pathname]);

  const handleMenuClick = useCallback(() => setSidebarOpen((p) => !p), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <NotificationProvider>
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <AssistantSidebar
        open={sidebarOpen}
        onClose={handleCloseSidebar}
        onNavigate={handleCloseSidebar}
        profile={profile}
        user={user}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AssistantTopbar
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

export default AssistantLayout;
