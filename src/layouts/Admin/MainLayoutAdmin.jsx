import SideNavBar from "../../components/SideNavBar/SideNavBarRender";
import profile from "../../assets/navbar/address-card-regular.svg";
import users from "../../assets/navbar/user-solid.svg";
import { Outlet } from "react-router-dom";

function MainLayout() {
  const AdminNavItems = [
    { icon: profile, title: "Home", link: "home" },
    { icon: profile, title: "Academic Structure", link: "colleges" },
    { icon: profile, title: "Assignments", link: "assignments" },
    { icon: users, title: "User Management", link: "create-admin" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar - Visible on iPad landscape and larger */}
      <div className="hidden ipad-landscape:block w-56 ipad-pro-landscape:w-64 flex-shrink-0">
        <SideNavBar navItems={AdminNavItems} />
      </div>

      {/* Mobile Sidebar (Floating) - Visible on portrait and smaller screens */}
      <div className="block ipad-landscape:hidden fixed z-50">
        <SideNavBar navItems={AdminNavItems} mobile />
      </div>

      {/* Main content with responsive padding */}
      <div className="flex-1 min-w-0 overflow-y-auto p-4 ipad-portrait:p-6 ipad-pro-portrait:p-8">
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;
