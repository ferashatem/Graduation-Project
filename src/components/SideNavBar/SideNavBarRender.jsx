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
        <div className="fixed top-0 left-0 z-50 flex w-full items-center gap-3 bg-white/85 px-4 py-3 text-[#0b2c4a] shadow-lg ring-1 ring-white/60 backdrop-blur">
          <HiMenu
            size={28}
            className="cursor-pointer rounded-xl bg-[#0b2c4a]/10 p-1 text-[#0b2c4a]"
            onClick={() => setOpen(!open)}
          />
          <span className="text-xs font-semibold uppercase tracking-[0.22em]">
            Menu
          </span>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen text-[#0b2c4a] 
          ${
            isMobile
              ? "w-64 max-w-[80vw]"
              : "min-w-[260px] max-w-[260px] w-[17%]"
          }
          z-40 overflow-hidden bg-gradient-to-b from-[#f7f1e6] via-[#edf4ff] to-[#c7d7ff] shadow-2xl ring-1 ring-white/60 transition-transform duration-300
          ${isMobile ? (open ? "translate-x-0" : "-translate-x-full") : ""}
          `}
      >
        <div className="pointer-events-none absolute -top-16 -left-12 h-36 w-36 rounded-full bg-[#103c6b]/15 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-44 w-44 translate-x-1/3 rounded-full bg-[#ffcf70]/25 blur-3xl" />

        <div className="relative z-10 flex h-full flex-col justify-between">
          {/* Logo and Profile */}
          <div className="mt-16 flex flex-col items-center gap-3 px-4 py-2 lg:mt-10">
            <div className="rounded-2xl bg-white/80 p-2 shadow-sm ring-1 ring-white/60">
              <img
                src={logo}
                alt="Logo"
                className="h-14 w-14 object-contain"
              />
            </div>
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
          <div className="pb-6">
            <LogoutIcon />
          </div>
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
