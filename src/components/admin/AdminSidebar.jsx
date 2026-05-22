import { useCallback, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  HiHome,
  HiAcademicCap,
  HiOfficeBuilding,
  HiUsers,
  HiUpload,
  HiLogout,
  HiChevronDown,
  HiChevronRight,
  HiUserGroup,
  HiLibrary,
  HiCalendar,
  HiCog,
  HiBookOpen,
  HiDocumentText,
  HiPlusCircle,
  HiChat,
  HiClipboardList,
  HiChartBar,
  HiBell,
} from "react-icons/hi";
import apiClient from "../../api/apiClient";
import { clearStoredSession } from "../../auth/session";
import logo from "../../assets/university-logo.png";
import fallbackAvatar from "../../assets/imgs/profile.png";

const getStoredName  = () => localStorage.getItem("userName")  || "";
const getStoredEmail = () => localStorage.getItem("userEmail") || "";

const resolveName = (profile, user) =>
  profile?.fullName || profile?.Full_Name || profile?.name ||
  profile?.displayName || user?.displayName || getStoredName() || "Admin";

const resolveEmail = (profile, user) =>
  profile?.email || profile?.Email || user?.email || getStoredEmail() || "";

const ADMIN_SECTIONS = [
  {
    id: "structure", label: "Structure Management", icon: HiLibrary,
    items: [
      { label: "Colleges & Structure", to: "/admin/colleges",    icon: HiAcademicCap },
    ],
  },
  {
    id: "academic", label: "Academic Affairs", icon: HiCalendar,
    items: [
      { label: "Regulations", to: "/admin/regulations", icon: HiDocumentText },
    ],
  },
  {
    id: "subjects", label: "Subjects & Registration", icon: HiBookOpen,
    items: [
      { label: "Subjects",    to: "/admin/subjects",     icon: HiBookOpen      },
      { label: "Enrollments", to: "/admin/enrollments",  icon: HiClipboardList },
    ],
  },
  {
    id: "students", label: "Student Affairs", icon: HiUserGroup,
    items: [
      { label: "All Students",        to: "/admin/students",         icon: HiUsers      },
      { label: "Register Student",    to: "/admin/register-student", icon: HiPlusCircle },
      { label: "Import Students",     to: "/admin/import-students",  icon: HiUpload     },
      { label: "Bulk Import (Legacy)",to: "/admin/bulk-import-users",icon: HiUpload     },
      { label: "Academic Import",     to: "/admin/academic-import",  icon: HiUpload     },
    ],
  },
  {
    id: "staff", label: "Staff Affairs", icon: HiUsers,
    items: [
      { label: "Doctors",         to: "/admin/doctors",         icon: HiAcademicCap },
      { label: "Register Doctor", to: "/admin/register-doctor", icon: HiPlusCircle  },
      { label: "Create Admin",    to: "/admin/create-admin",    icon: HiUsers       },
    ],
  },
  {
    id: "schedule", label: "Timetable", icon: HiCalendar,
    items: [
      { label: "Schedule Manager", to: "/admin/schedule", icon: HiCalendar },
    ],
  },
  {
    id: "complaints", label: "Complaints", icon: HiClipboardList,
    items: [
      { label: "All Complaints", to: "/admin/complaints", icon: HiClipboardList },
    ],
  },
  {
    id: "analytics", label: "Analytics & Reports", icon: HiChartBar,
    items: [
      { label: "Analytics Dashboard", to: "/admin/analytics",     icon: HiChartBar },
      { label: "Send Notifications",  to: "/admin/notifications", icon: HiBell     },
    ],
  },
  {
    id: "settings", label: "Settings & Reports", icon: HiCog,
    items: [
      { label: "Campus Buildings", to: "/admin/campus-buildings", icon: HiOfficeBuilding },
      { label: "Change Password",  to: "/admin/change-password",  icon: HiCog           },
    ],
  },
];

const SUPER_ADMIN_SECTIONS = [
  {
    id: "users", label: "User Management", icon: HiUsers,
    items: [
      { label: "Create Admin", to: "/super_admin/create-admin",    icon: HiUsers  },
      { label: "Bulk Import",  to: "/super_admin/bulk-import-users",icon: HiUpload },
    ],
  },
];

// ── Section ──────────────────────────────────────────────────────────────────
function NavSection({ section, onNavigate, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = section.icon;

  return (
    <div>
      {/* Section header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition hover:bg-white/[0.06]"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">{section.label}</span>
        {open
          ? <HiChevronDown className="h-3 w-3" />
          : <HiChevronRight className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-0.5 ml-2 space-y-0.5 border-l border-white/10 pl-2">
          {section.items.map((item) => {
            const ItemIcon = item.icon;
            return (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                end={item.end !== false}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition border-l-[2px] ${
                    isActive
                      ? "bg-[#2e86ab]/15 text-white border-[#2e86ab]"
                      : "text-white/60 hover:bg-white/[0.06] hover:text-white/90 border-transparent"
                  }`
                }
              >
                <ItemIcon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── AdminSidebar ──────────────────────────────────────────────────────────────
function AdminSidebar({ open = false, onClose, onNavigate, profile, user, role = "admin" }) {
  const navigate = useNavigate();

  const sections = useMemo(
    () => (role === "super_admin" ? SUPER_ADMIN_SECTIONS : ADMIN_SECTIONS),
    [role]
  );

  const handleNavigate = useCallback(() => {
    if (onNavigate) { onNavigate(); return; }
    if (onClose) onClose();
  }, [onClose, onNavigate]);

  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (refreshToken) await apiClient.post("/auth/logout", { refreshToken });
    } catch {}
    clearStoredSession();
    if (onClose) onClose();
    navigate("/signin", { replace: true });
  }, [navigate, onClose]);

  const displayName = useMemo(() => resolveName(profile, user), [profile, user]);
  const email       = useMemo(() => resolveEmail(profile, user), [profile, user]);
  const avatarUrl   = profile?.photoURL || profile?.PhotoURL || user?.photoURL || fallbackAvatar;
  const roleLabel   = role === "super_admin" ? "Super Admin" : "Admin";
  const homeLink    = role === "super_admin" ? "/super_admin/home" : "/admin/home";

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-40 flex h-screen w-64 max-w-[80vw] flex-col shadow-2xl transition-transform duration-300 ipad-landscape:static ipad-landscape:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "#0d1b2a",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* ── Logo ── */}
        <div className="flex items-center gap-3 px-5 pb-4 pt-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="rounded-xl p-2"
            style={{ background: "rgba(46,134,171,0.18)", border: "1px solid rgba(46,134,171,0.25)" }}>
            <img src={logo} alt="University logo" className="h-10 w-10 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: "rgba(255,255,255,0.35)" }}>
              {roleLabel}
            </p>
            <p className="truncate text-sm font-bold" style={{ color: "#fff" }}>
              UniSys
            </p>
          </div>
        </div>

        {/* ── Home link ── */}
        <div className="px-3 pt-3">
          <NavLink
            to={homeLink}
            end
            onClick={handleNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition border-l-[2px] ${
                isActive
                  ? "bg-[#2e86ab]/15 text-white border-[#2e86ab]"
                  : "text-white/60 hover:bg-white/[0.06] hover:text-white/90 border-transparent"
              }`
            }
          >
            <HiHome className="h-5 w-5 shrink-0" />
            <span>Home</span>
          </NavLink>
        </div>

        {/* ── User card ── */}
        <div className="mx-3 mt-3 mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
          <img src={avatarUrl} alt="Avatar"
            className="h-9 w-9 rounded-full object-cover flex-shrink-0"
            style={{ border: "2px solid rgba(46,134,171,0.5)" }} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: "#fff" }}>
              {displayName}
            </p>
            {email && (
              <p className="truncate text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {email}
              </p>
            )}
          </div>
        </div>

        {/* ── Nav sections ── */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {sections.map((section, index) => (
            <NavSection
              key={section.id}
              section={section}
              onNavigate={handleNavigate}
              defaultOpen={index === 0}
            />
          ))}
        </nav>

        {/* ── AI Chat link ── */}
        {role === "admin" && (
          <div className="px-3 pb-2">
            <NavLink
              to="/admin/chat"
              onClick={handleNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition border-l-[2px] ${
                  isActive
                    ? "bg-[#7c3aed]/15 text-white border-[#7c3aed]"
                    : "text-white/60 hover:bg-white/[0.06] hover:text-white/90 border-transparent"
                }`
              }
            >
              <HiChat className="h-5 w-5 shrink-0" />
              <span>AI Assistant</span>
            </NavLink>
          </div>
        )}

        {/* ── Logout ── */}
        <div className="px-3 pb-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px" }}>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10"
            style={{
              color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <HiLogout className="h-4 w-4" />
            Logout
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

export default AdminSidebar;
