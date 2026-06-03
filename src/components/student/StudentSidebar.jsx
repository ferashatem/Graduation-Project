import { useCallback, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  HiAcademicCap, HiBookOpen, HiCalendar, HiChat, HiClipboardList,
  HiDocumentText, HiHome, HiKey, HiLogout, HiPencilAlt, HiChartBar, HiMap,
  HiBell, HiSparkles,
} from "react-icons/hi";
import { clearStoredSession } from "../../auth/session";
import { resetAuthUser } from "../../auth/useAuthUser";
import logo from "../../assets/university-logo.png";
import fallbackAvatar from "../../assets/imgs/profile.png";

const resolveName = (profile, user) =>
  profile?.fullName || profile?.Full_Name || profile?.name ||
  user?.displayName || "Student";

const resolveEmail = (profile, user) =>
  profile?.email || user?.email || "";

function StudentSidebar({ open = false, onClose, onNavigate, profile, user }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navItems = useMemo(() => [
    { label: t("studentNav.home"),           to: "/student",                 icon: HiHome,         end: true },
    { label: t("studentNav.myCourses"),      to: "/student/courses",         icon: HiBookOpen              },
    { label: t("studentNav.mySchedule"),     to: "/student/schedule",        icon: HiCalendar              },
    { label: t("studentNav.myGrades"),       to: "/student/grades",          icon: HiAcademicCap           },
    { label: t("studentNav.academicStatus"), to: "/student/academic-status", icon: HiChartBar              },
    { label: t("studentNav.myRoadmap"),      to: "/student/roadmap",         icon: HiMap                   },
    { label: t("studentNav.assignments"),    to: "/student/assignments",     icon: HiDocumentText          },
    { label: t("studentNav.quizzes"),        to: "/student/quizzes",         icon: HiPencilAlt             },
    { label: t("studentNav.myComplaints"),   to: "/student/complaints",      icon: HiClipboardList         },
    { label: t("studentNav.notifications"),  to: "/student/notifications",   icon: HiBell                  },
    { label: t("studentNav.aiCompanion"),    to: "/student/companion",       icon: HiSparkles              },
    { label: t("studentNav.aiAssistant"),    to: "/student/chat",            icon: HiChat                  },
    { label: t("studentNav.changePassword"), to: "/student/change-password", icon: HiKey                   },
  ], [t]);

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
  const avatarUrl   = profile?.photoURL || user?.photoURL || fallbackAvatar;

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
              {t("studentNav.role")}
            </p>
            <p className="truncate text-sm font-bold" style={{ color: "#fff" }}>
              UniSys
            </p>
          </div>
        </div>

        {/* ── User card ── */}
        <div className="mx-3 mt-4 mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
          <img src={avatarUrl} alt="Student avatar"
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

        {/* ── Nav ── */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isAI = item.to === "/student/chat";
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={handleNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition border-l-[2px] ${
                    isActive
                      ? isAI
                        ? "bg-[#7c3aed]/15 text-white border-[#7c3aed]"
                        : "bg-[#2e86ab]/15 text-white border-[#2e86ab]"
                      : "text-white/60 hover:bg-white/[0.06] hover:text-white/90 border-transparent"
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

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
            {t("studentNav.logout")}
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

export default StudentSidebar;
