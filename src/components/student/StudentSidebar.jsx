import { useCallback, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { HiBookOpen, HiChat, HiHome, HiLogout, HiPencilAlt } from "react-icons/hi";
import { clearStoredSession } from "../../auth/session";
import { auth } from "../../firebase/firebaseConfig";
import logo from "../../assets/university-logo.png";
import fallbackAvatar from "../../assets/imgs/profile.png";

const resolveName = (profile, user) =>
  profile?.fullName || profile?.Full_Name || profile?.name || user?.displayName || "Student";

const resolveEmail = (profile, user) =>
  profile?.email || user?.email || "";

function StudentSidebar({ open = false, onClose, onNavigate, profile, user }) {
  const navigate = useNavigate();

  const navItems = useMemo(
    () => [
      { label: "Home", to: "/student", icon: HiHome, end: true },
      { label: "My Courses", to: "/student/courses", icon: HiBookOpen },
      { label: "Quizzes", to: "/student/quizzes", icon: HiPencilAlt },
      { label: "AI Assistant", to: "/student/chat", icon: HiChat },
    ],
    []
  );

  const handleNavigate = useCallback(() => {
    if (onNavigate) { onNavigate(); return; }
    if (onClose) onClose();
  }, [onClose, onNavigate]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {}
    clearStoredSession();
    if (onClose) onClose();
    navigate("/signin", { replace: true });
  }, [navigate, onClose]);

  const displayName = useMemo(() => resolveName(profile, user), [profile, user]);
  const email = useMemo(() => resolveEmail(profile, user), [profile, user]);
  const avatarUrl = profile?.photoURL || user?.photoURL || fallbackAvatar;

  const linkBase = "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition";
  const linkActive = "bg-white/85 text-slate-900 shadow-sm ring-1 ring-white/70";
  const linkInactive = "text-slate-700 hover:bg-white/70";

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-40 flex h-screen w-64 max-w-[80vw] flex-col bg-gradient-to-b from-[#e8f0fe] via-[#eef4ff] to-[#c7d8f7] shadow-2xl ring-1 ring-white/60 transition-transform duration-300 ipad-landscape:static ipad-landscape:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative flex items-center gap-3 px-6 pb-4 pt-6">
          <div className="rounded-2xl bg-white/80 p-2 shadow-sm ring-1 ring-white/60">
            <img src={logo} alt="University logo" className="h-12 w-12" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Student</p>
            <p className="truncate text-sm font-semibold text-slate-800">Portal</p>
          </div>
        </div>

        <div className="mx-6 mb-2 flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-white/60">
          <img src={avatarUrl} alt="Student avatar" className="h-10 w-10 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
            {email ? <p className="truncate text-xs text-slate-500">{email}</p> : null}
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
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
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

export default StudentSidebar;
