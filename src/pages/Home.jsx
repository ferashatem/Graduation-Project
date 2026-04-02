import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuthUser } from "../auth/useAuthUser";
import Loading from "../components/common/Loading";

export default function AdminHome() {
  const outletContext = useOutletContext() || {};
  const { user: outletUser, profile: outletProfile, profileLoading } = outletContext;
  const { user: authUser, authLoading } = useAuthUser();
  const user = outletUser || authUser;
  const profile = outletProfile || null;

  const viewModel = useMemo(() => {
    const p = profile || {};
    const rawRole = p.role ?? p.Role ?? p.title ?? p.Title ?? "";
    const roleLabel = rawRole
      .toString()
      .trim()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) || "Admin";

    return {
      name: p.fullName ?? p.Full_Name ?? user?.displayName ?? "—",
      email: p.email ?? p.Email ?? user?.email ?? "—",
      phone: p.phoneNumber ?? p.Phone_Number ?? "—",
      role: roleLabel,
      college: p.collegeName ?? p.college ?? p.collegeId ?? "—",
      uid: user?.uid ?? "—",
    };
  }, [profile, user]);

  if (authLoading || profileLoading) {
    return <Loading label="Loading..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">{viewModel.role} Overview</h1>
        <p className="text-sm text-slate-500">Your account details</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <InfoCard label="Full Name" value={viewModel.name} />
        <InfoCard label="Email" value={viewModel.email} />
        <InfoCard label="Phone Number" value={viewModel.phone} />
        <InfoCard label="Role" value={viewModel.role} />
        <InfoCard label="College" value={viewModel.college} />
        <InfoCard label="UID" value={viewModel.uid} mono />
      </div>
    </div>
  );
}

function InfoCard({ label, value, mono = false }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p
        className={`mt-2 truncate text-sm font-semibold text-slate-800 ${
          mono ? "font-mono text-xs" : ""
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}
