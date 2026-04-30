import { useCallback, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
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
} from "react-icons/hi";
import apiClient from "../../api/apiClient";
import { clearStoredSession } from "../../auth/session";
import { auth } from "../../firebase/firebaseConfig";
import logo from "../../assets/university-logo.png";
import fallbackAvatar from "../../assets/imgs/profile.png";

const getStoredName = () => localStorage.getItem("userName") || "";
const getStoredEmail = () => localStorage.getItem("userEmail") || "";

const resolveName = (profile, user) =>
  profile?.fullName ||
  profile?.Full_Name ||
  profile?.name ||
  profile?.displayName ||
  user?.displayName ||
  getStoredName() ||
  "Admin";

const resolveEmail = (profile, user) =>
  profile?.email ||
  profile?.Email ||
  user?.email ||
  getStoredEmail() ||
  "";

const ADMIN_SECTIONS = [
  {
    id: "structure",
    label: "Structure Management",
    icon: HiLibrary,
    items: [
      {
        label: "Colleges & Structure",
        to: "/admin/colleges",
        icon: HiAcademicCap,
      },
    ],
  },
  {
    id: "academic",
    label: "Academic Affairs",
    icon: HiCalendar,
    items: [
      {
        label: "Academic Years & Semesters",
        to: "/admin/colleges",
        icon: HiCalendar,
        end: false,
      },
      { label: "Regulations", to: "/admin/regulations", icon: HiDocumentText },
    ],
  },
  {
    id: "subjects",
    label: "Subjects & Registration",
    icon: HiBookOpen,
    items: [{ label: "Subjects", to: "/admin/subjects", icon: HiBookOpen }],
  },
  {
    id: "students",
    label: "Student Affairs",
    icon: HiUserGroup,
    items: [
      { label: "All Students", to: "/admin/students", icon: HiUsers },
      {
        label: "Register Student",
        to: "/admin/register-student",
        icon: HiPlusCircle,
      },
      { label: "Bulk Import", to: "/admin/bulk-import-users", icon: HiUpload },
    ],
  },
  {
    id: "staff",
    label: "Staff Affairs",
    icon: HiUsers,
    items: [
      { label: "Doctors", to: "/admin/doctors", icon: HiAcademicCap },
      {
        label: "Register Doctor",
        to: "/admin/register-doctor",
        icon: HiPlusCircle,
      },
      { label: "Create Admin", to: "/admin/create-admin", icon: HiUsers },
    ],
  },
  {
    id: "settings",
    label: "Settings & Reports",
    icon: HiCog,
    items: [
      {
        label: "Campus Buildings",
        to: "/admin/campus-buildings",
        icon: HiOfficeBuilding,
      },
    ],
  },
];

const SUPER_ADMIN_SECTIONS = [
  {
    id: "users",
    label: "User Management",
    icon: HiUsers,
    items: [
      { label: "Create Admin", to: "/super_admin/create-admin", icon: HiUsers },
      {
        label: "Bulk Import",
        to: "/super_admin/bulk-import-users",
        icon: HiUpload,
      },
    ],
  },
];

function NavSection({ section, onNavigate, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = section.icon;

  const linkBase =
    "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition";
  const linkActive = "bg-white/85 text-slate-900 shadow-sm ring-1 ring-white/70";
  const linkInactive = "text-slate-700 hover:bg-white/70";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500 transition hover:bg-white/40"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{section.label}</span>
        {open ? (
          <HiChevronDown className="h-3.5 w-3.5" />
        ) : (
          <HiChevronRight className="h-3.5 w-3.5" />
        )}
      </button>

      {open ? (
        <div className="mt-0.5 ml-2 space-y-0.5 border-l-2 border-slate-300/50 pl-2">
          {section.items.map((item) => {
            const ItemIcon = item.icon;
            return (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                end={item.end !== false}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <ItemIcon className="h-4 w-4 shrink-0" />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function AdminSidebar({
  open = false,
  onClose,
  onNavigate,
  profile,
  user,
  role = "admin",
}) {
  const navigate = useNavigate();

  const sections = useMemo(
    () => (role === "super_admin" ? SUPER_ADMIN_SECTIONS : ADMIN_SECTIONS),
    [role]
  );

  const handleNavigate = useCallback(() => {
    if (onNavigate) {
      onNavigate();
      return;
    }

    if (onClose) onClose();
  }, [onClose, onNavigate]);

  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await apiClient.post("/auth/logout", { refreshToken });
      }
    } catch {}

    try {
      await signOut(auth);
    } catch {}

    clearStoredSession();
    if (onClose) onClose();
    navigate("/signin", { replace: true });
  }, [navigate, onClose]);

  const displayName = useMemo(() => resolveName(profile, user), [profile, user]);
  const email = useMemo(() => resolveEmail(profile, user), [profile, user]);
  const avatarUrl =
    profile?.photoURL || profile?.PhotoURL || user?.photoURL || fallbackAvatar;
  const roleLabel = role === "super_admin" ? "Super Admin" : "Admin";
  const homeLink = role === "super_admin" ? "/super_admin/home" : "/admin/home";

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-40 flex h-screen w-64 max-w-[80vw] flex-col bg-gradient-to-b from-[#e6eeff] via-[#eef2ff] to-[#d0d9f5] shadow-2xl ring-1 ring-white/60 transition-transform duration-300 ipad-landscape:static ipad-landscape:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-6 pb-4 pt-6">
          <div className="rounded-2xl bg-white/80 p-2 shadow-sm ring-1 ring-white/60">
            <img src={logo} alt="University logo" className="h-12 w-12" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {roleLabel}
            </p>
            <p className="truncate text-sm font-semibold text-slate-800">
              Dashboard
            </p>
          </div>
        </div>

        <div className="px-4 pb-1">
          <NavLink
            to={homeLink}
            end
            onClick={handleNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-white/85 text-slate-900 shadow-sm ring-1 ring-white/70"
                  : "text-slate-700 hover:bg-white/70"
              }`
            }
          >
            <HiHome className="h-5 w-5 shrink-0" />
            <span>Home</span>
          </NavLink>
        </div>

        <div className="mx-4 mb-3 flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-white/60">
          <img
            src={avatarUrl}
            alt="Avatar"
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {displayName}
            </p>
            {email ? <p className="truncate text-xs text-slate-500">{email}</p> : null}
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-4">
          {sections.map((section, index) => (
            <NavSection
              key={section.id}
              section={section}
              onNavigate={handleNavigate}
              defaultOpen={index === 0}
            />
          ))}
        </nav>

        <div className="px-4 pb-2">
          {role === "admin" && (
            <NavLink
              to="/admin/chat"
              onClick={handleNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-white/85 text-slate-900 shadow-sm ring-1 ring-white/70"
                    : "text-slate-700 hover:bg-white/70"
                }`
              }
            >
              <HiChat className="h-5 w-5 shrink-0" />
              <span>AI Assistant</span>
            </NavLink>
          )}
        </div>

        <div className="px-4 pb-6">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1e3a6e] via-[#2d5be3] to-[#1e3a6e] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-lg transition hover:translate-y-[-1px] hover:shadow-xl"
          >
            <HiLogout className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {open ? (
        <div
          className="fixed inset-0 z-30 bg-black/40 ipad-landscape:hidden"
          onClick={handleNavigate}
          role="presentation"
        />
      ) : null}
    </>
  );
}

export default AdminSidebar;
