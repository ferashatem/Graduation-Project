import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HiMenu } from "react-icons/hi";
import fallbackAvatar from "../../assets/imgs/profile.png";
import NotificationDropdown from "../shared/NotificationDropdown";
import LanguageSwitcher from "../common/LanguageSwitcher";

const resolveName = (profile, user) =>
  profile?.fullName ||
  profile?.Full_Name ||
  profile?.name ||
  profile?.displayName ||
  user?.displayName ||
  "Professor";

const resolveEmail = (profile, user) =>
  profile?.email || profile?.Email || user?.email || "";

function ProfessorTopbar({ title, profile, user, onMenuClick }) {
  const { t } = useTranslation();
  const viewModel = useMemo(() => {
    const name = resolveName(profile, user);
    const email = resolveEmail(profile, user);
    const photoURL =
      profile?.photoURL || profile?.PhotoURL || user?.photoURL || fallbackAvatar;

    return {
      name,
      email,
      photoURL,
      greeting: name ? t("common.welcomeBack", { name }) : t("common.welcome"),
    };
  }, [profile, user, t]);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur ipad-portrait:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl bg-slate-100 p-2 text-slate-700 shadow-sm transition hover:bg-slate-200 ipad-landscape:hidden"
          aria-label={t("common.menu")}
        >
          <HiMenu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
          <p className="text-xs text-slate-500">{viewModel.greeting}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <NotificationDropdown />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-700">
            {viewModel.name}
          </p>
          {viewModel.email ? (
            <p className="text-xs text-slate-500">{viewModel.email}</p>
          ) : null}
        </div>
        <img
          src={viewModel.photoURL}
          alt="Professor avatar"
          className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
        />
      </div>
    </header>
  );
}

export default ProfessorTopbar;
