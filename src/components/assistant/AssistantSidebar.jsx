import { useCallback, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { HiBookOpen, HiChat, HiHome, HiKey, HiLogout } from "react-icons/hi";
import { clearStoredSession } from "../../auth/session";
import { resetAuthUser } from "../../auth/useAuthUser";
import logo from "../../assets/university-logo.png";
import fallbackAvatar from "../../assets/imgs/profile.png";

const resolveName = (profile, user) =>
  profile?.fullName ||
  profile?.Full_Name ||
  profile?.name ||
  profile?.displayName ||
  user?.displayName ||
  "Assistant";

const resolveEmail = (profile, user) =>
  profile?.email || profile?.Email || user?.email || "";

function AssistantSidebar({ open = false, onClose, onNavigate, profile, user }) {
  const navigate = useNavigate();

  const navItems = useMemo(
    () => [
      { label: "Home", to: "/asst", icon: HiHome, end: true },
      { label: "Courses", to: "/asst/courses", icon: HiBookOpen },
      { label: "AI Assistant", to: "/asst/chat", icon: HiChat },
      { label: "Change Password", to: "/asst/change-password", icon: HiKey },
    ],
    []
  );

  const handleNavigate = useCallback(() => {
    if (onNavigate) {
      onNavigate();
      return;
    }
    if (onClose) onClose();
  }, [onClose, onNavigate]);

  const handleLogout = useCallback(() => {
    clearStoredSession();
    resetAuthUser();
    if (onClose) onClose();
    navigate("/signin", { replace: true });
  }, [navigate, onClose]);

  const displayName = useMemo(() => resolveName(profile, user), [profile, user]);
  const email = useMemo(() => resolveEmail(profile, user), [profile, user]);
  const avatarUrl =
    profile?.photoURL || profile?.PhotoURL || user?.photoURL || fallbackAvatar;

  const linkBase =
    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition";
  const linkActive =
    "bg-white/85 text-slate-900 shadow-sm ring-1 ring-white/70";
  const linkInactive = "text-slate-700 hover:bg-white/70";

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-40 flex h-screen w-64 max-w-[80vw] flex-col bg-gradient-to-b from-[#e6f7f1] via-[#edfff4] to-[#c7e8d7] shadow-2xl ring-1 ring-white/60 transition-transform duration-300 ipad-landscape:static ipad-landscape:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative flex items-center gap-3 px-6 pb-4 pt-6">
          <div className="rounded-2xl bg-white/80 p-2 shadow-sm ring-1 ring-white/60">
            <img src={logo} alt="University logo" className="h-12 w-12" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Assistant
            </p>
            <p className="truncate text-sm font-semibold text-slate-800">
              Dashboard
            </p>
          </div>
        </div>

        <div className="mx-6 mb-2 flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-white/60">
          <img
            src={avatarUrl}
            alt="Assistant avatar"
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {displayName}
            </p>
            {email ? (
              <p className="truncate text-xs text-slate-500">{email}</p>
            ) : null}
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={handleNavigate}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-4 pb-6">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0b2c4a] via-[#1d5fa3] to-[#0b2c4a] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-lg transition hover:translate-y-[-1px] hover:shadow-xl"
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

export default AssistantSidebar;
