import { useMemo } from "react";
import { HiMenu } from "react-icons/hi";
import fallbackAvatar from "../../assets/imgs/profile.png";

const resolveName = (profile, user) =>
  profile?.fullName ||
  profile?.Full_Name ||
  profile?.name ||
  profile?.displayName ||
  user?.displayName ||
  "Admin";

const resolveEmail = (profile, user) =>
  profile?.email || profile?.Email || user?.email || "";

function AdminTopbar({ title, profile, user, onMenuClick, role = "admin" }) {
  const viewModel = useMemo(() => {
    const name = resolveName(profile, user);
    const email = resolveEmail(profile, user);
    const photoURL =
      profile?.photoURL || profile?.PhotoURL || user?.photoURL || fallbackAvatar;
    const roleLabel = role === "super_admin" ? "Super Admin" : "Admin";
    return {
      name,
      email,
      photoURL,
      greeting: name ? `Welcome back, ${name}` : "Welcome back",
      roleLabel,
    };
  }, [profile, user, role]);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur ipad-portrait:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl bg-slate-100 p-2 text-slate-700 shadow-sm transition hover:bg-slate-200 ipad-landscape:hidden"
          aria-label="Open menu"
        >
          <HiMenu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
          <p className="text-xs text-slate-500">{viewModel.greeting}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-700">{viewModel.name}</p>
          <p className="text-xs text-slate-500">{viewModel.roleLabel}</p>
        </div>
        <img
          src={viewModel.photoURL}
          alt="Avatar"
          className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
        />
      </div>
    </header>
  );
}

export default AdminTopbar;
