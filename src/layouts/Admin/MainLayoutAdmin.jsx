import SideNavBar from "../../components/SideNavBar/SideNavBarRender";
import Listing from "../../assets/imgs/navbar/listing.png";
import Owners from "../../assets/imgs/navbar/owners.png";
import shares from "../../assets/imgs/navbar/shares.png";
import userManagment from "../../assets/imgs/userManagment.png";
import person from "../../assets/imgs/navbar/person.png";
import reward from "../../assets/imgs/navbar/reward.png";
import settings from "../../assets/imgs/navbar/managment.png";
import dashboard from "../../assets/imgs/navbar/dashboard.png";
import brokers from "../../assets/imgs/navbar/brokers.png";
import { Outlet } from "react-router-dom";

function MainLayout() {
  const AdminNavItems = [
    { icon: dashboard, title: "Home", link: "home" },
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
