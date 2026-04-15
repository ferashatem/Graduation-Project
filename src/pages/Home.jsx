export default function AdminHome() {
  const fullName = localStorage.getItem("userName") || "—";
  const loginEmail = localStorage.getItem("userEmail") || "—";
  const rawRole = localStorage.getItem("role") || "Admin";
  const roleLabel = rawRole.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">{roleLabel} Overview</h1>
        <p className="text-sm text-slate-500">Your account details</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <InfoCard label="Full Name" value={fullName} />
        <InfoCard label="Email" value={loginEmail} />
        <InfoCard label="Role" value={roleLabel} />
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
