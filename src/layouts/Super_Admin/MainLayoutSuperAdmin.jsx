import SideNavBar from "../../components/SideNavBar/SideNavBarRender";
import users from "../../assets/navbar/user-solid.svg";
import profile from "../../assets/navbar/address-card-regular.svg";
import people from "../../assets/navbar/people-group-solid.svg";
import { Outlet } from "react-router-dom";

function MainLayoutSuperAdmin() {
  const SuperAdminNavItems = [
    { icon: profile, title: "Home", link: "home" },
    { icon: people, title: "Attendance", link: "/offerings" },
    { icon: users, title: "User Management", link: "create-admin" },
    { icon: users, title: "Bulk Import Users", link: "bulk-import-users" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar - Visible on iPad landscape and larger */}
      <div className="hidden ipad-landscape:block w-56 ipad-pro-landscape:w-64 flex-shrink-0">
        <SideNavBar navItems={SuperAdminNavItems} />
      </div>

      {/* Mobile Sidebar (Floating) - Visible on portrait and smaller screens */}
      <div className="block ipad-landscape:hidden fixed z-50">
        <SideNavBar navItems={SuperAdminNavItems} mobile />
      </div>

      {/* Main content with responsive padding */}
      <div className="flex-1 min-w-0 overflow-y-auto p-4 ipad-portrait:p-6 ipad-pro-portrait:p-8">
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayoutSuperAdmin;
