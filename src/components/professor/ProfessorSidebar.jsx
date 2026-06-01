import { useCallback, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  HiBookOpen, HiCalendar, HiChat, HiClipboardList,
  HiHome, HiKey, HiLogout, HiUserGroup, HiTable,
} from "react-icons/hi";
import { clearStoredSession } from "../../auth/session";
import { resetAuthUser } from "../../auth/useAuthUser";
import { usePendingComplaintsCount } from "../../features/complaints/hooks/useComplaints";
import logo from "../../assets/university-logo.png";
import fallbackAvatar from "../../assets/imgs/profile.png";

const resolveName = (profile, user) =>
  profile?.fullName || profile?.Full_Name || profile?.name ||
  profile?.displayName || user?.displayName || "Professor";

const resolveEmail = (profile, user) =>
  profile?.email || profile?.Email || user?.email || "";

function ProfessorSidebar({ open = false, onClose, onNavigate, profile, user }) {
  const navigate = useNavigate();
  const pendingCount = usePendingComplaintsCount();

  const navItems = useMemo(() => [
    { label: "Home",              to: "/prof",                 icon: HiHome,         end: true },
    { label: "Courses",           to: "/prof/courses",         icon: HiBookOpen              },
    { label: "My Schedule",       to: "/prof/schedule",        icon: HiCalendar              },
    { label: "Attendance",        to: "/prof/attendance",      icon: HiUserGroup             },
    { label: "Assignments",       to: "/prof/assignments",     icon: HiClipboardList         },
    { label: "Exams",             to: "/prof/exams",           icon: HiClipboardList         },
    { label: "Complaint Reports", to: "/prof/complaints",      icon: HiClipboardList         },
    { label: "Import Grades",     to: "/prof/grades-import",   icon: HiTable                 },
    { label: "AI Assistant",      to: "/prof/chat",            icon: HiChat                  },
    { label: "Change Password",   to: "/prof/change-password", icon: HiKey                   },
  ], []);

  const handleNavigate = useCallback(() => {
    if (onNavigate) { onNavigate(); return; }
    if (onClose) onClose();
  }, [onClose, onNavigate]);

  const handleLogout = useCallback(() => {
    clearStoredSession();
    resetAuthUser();
    if (onClose) onClose();
    navigate("/signin", { replace: true });
  }, [navigate, onClose]);

  const displayName = useMemo(() => resolveName(profile, user), [profile, user]);
  const email       = useMemo(() => resolveEmail(profile, user), [profile, user]);
  const avatarUrl   = profile?.photoURL || profile?.PhotoURL || user?.photoURL || fallbackAvatar;

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-40 flex h-screen w-64 max-w-[80vw] flex-col shadow-2xl transition-transform duration-300 ipad-landscape:static ipad-landscape:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "#112240", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* ── Logo ── */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center p-1.5">
              <img src={logo} alt="University logo" className="h-full w-full object-contain" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#4dd8e8] border-2 border-[#112240]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Professor</p>
            <p className="text-sm font-bold text-white">UniSys</p>
          </div>
        </div>

        {/* ── User card ── */}
        <div className="mx-3 mt-3 mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <img src={avatarUrl} alt="avatar"
            className="h-9 w-9 rounded-full object-cover flex-shrink-0"
            style={{ border: "2px solid rgba(77,216,232,0.4)" }} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            {email && (
              <p className="truncate text-[11px] text-white/40">{email}</p>
            )}
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isAI = item.to === "/prof/chat";
            const isComplaints = item.to === "/prof/complaints";
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={handleNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? isAI
                        ? "bg-[#7c3aed]/20 text-[#c4b5fd]"
                        : "bg-[#4dd8e8]/15 text-[#4dd8e8]"
                      : "text-white/55 hover:bg-white/[0.06] hover:text-white/85"
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isComplaints && pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white min-w-[18px]">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── Logout ── */}
        <div className="px-3 pb-5 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white/50 transition hover:bg-white/08 hover:text-white/80"
          >
            <HiLogout className="h-4 w-4" />
            <span>Logout</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 ipad-landscape:hidden"
          onClick={handleNavigate}
          role="presentation"
        />
      )}
    </>
  );
}

export default ProfessorSidebar;
