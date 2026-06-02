import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HiMenu } from "react-icons/hi";
import fallbackAvatar from "../../assets/imgs/profile.png";
import NotificationDropdown from "../shared/NotificationDropdown";
import LanguageSwitcher from "../common/LanguageSwitcher";

const getStoredName  = () => localStorage.getItem("userName")  || "";
const getStoredEmail = () => localStorage.getItem("userEmail") || "";

const resolveName = (profile, user) =>
  profile?.fullName || profile?.Full_Name || profile?.name ||
  profile?.displayName || user?.displayName || getStoredName() || "Admin";

const resolveEmail = (profile, user) =>
  profile?.email || profile?.Email || user?.email || getStoredEmail() || "";

function AdminTopbar({ title, profile, user, onMenuClick, role = "admin" }) {
  const { t } = useTranslation();
  const viewModel = useMemo(() => {
    const name      = resolveName(profile, user);
    const email     = resolveEmail(profile, user);
    const photoURL  = profile?.photoURL || profile?.PhotoURL || user?.photoURL || fallbackAvatar;
    const roleLabel = role === "super_admin" ? t("adminNav.roleSuperAdmin") : t("adminNav.roleAdmin");
    return { name, email, photoURL, roleLabel };
  }, [profile, role, user, t]);

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between gap-4 px-5 py-3"
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        height: "64px",
      }}
    >
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 transition ipad-landscape:hidden"
          style={{
            background: "#f0f4f8",
            border: "1px solid #e2e8f0",
            color: "#64748b",
          }}
          aria-label={t("common.menu", "Open menu")}
        >
          <HiMenu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base font-bold" style={{ color: "#1a1a2e" }}>{title}</h1>
        </div>
      </div>

      {/* Right: language + bell + user */}
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <NotificationDropdown />

        {/* User pill */}
        <div
          className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 transition hover:bg-slate-50"
          style={{ border: "1px solid #e2e8f0", background: "#f0f4f8", cursor: "pointer" }}
        >
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold" style={{ color: "#1a1a2e" }}>
              {viewModel.name}
            </p>
            <p className="text-xs" style={{ color: "#64748b" }}>
              {viewModel.email || viewModel.roleLabel}
            </p>
          </div>
          <img
            src={viewModel.photoURL}
            alt="Avatar"
            className="h-8 w-8 rounded-full object-cover flex-shrink-0"
            style={{ border: "2px solid #d6e8f7" }}
          />
        </div>
      </div>
    </header>
  );
}

export default AdminTopbar;
