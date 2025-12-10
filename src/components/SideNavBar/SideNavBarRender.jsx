// ✅ FINAL SIDEBAR LAYOUT LIKE THE PROVIDED IMAGE
// Assumes TailwindCSS is being used and project structure follows what you shared

import React, { useState, useEffect } from "react";
import { HiMenu } from "react-icons/hi";
import ProfileIcon from "./ProfileIcon";
import ListNavBar from "./ListNavBar";
import LogoutIcon from "./LogoutIcon";
import logo from "../../assets/university-logo.png"; // Replace with your logo file

function SideNavBar({ navItems }) {
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {isMobile && (
        <div className="bg-[#003567] w-full flex items-center px-4 py-3 fixed top-0 left-0 z-50">
          <HiMenu
            size={28}
            className="text-black cursor-pointer"
            onClick={() => setOpen(!open)}
          />
          <span className="text-white font-semibold ml-4">Menu</span>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`bg-blue-200 fixed top-0 left-0 h-screen text-black 
          ${
            isMobile
              ? "w-64 max-w-[80vw]"
              : "min-w-[260px] max-w-[260px] w-[17%]"
          }
          flex flex-col justify-between z-40 transition-transform duration-300
          ${isMobile ? (open ? "translate-x-0" : "-translate-x-full") : ""}
          shadow-lg text-black`}
      >
        {/* Logo and Profile */}
        <div className="flex flex-col gap-1 px-4 lg:mt-10 mt-12 py-1 items-center">
          <img src={logo} alt="Logo" className="w-[80px] mb-2" />
          <ProfileIcon />
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto">
          <ListNavBar
            isMobile={isMobile}
            closeMenu={() => setOpen(false)}
            navItems={navItems}
          />
        </div>

        {/* Logout Button */}
        <div>
          <LogoutIcon />
        </div>
      </div>

      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}

export default SideNavBar;