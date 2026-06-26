import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../api/authApi";
import { getRoleHomePath, getStoredRole } from "../auth/session";
import BigLogo from "../assets/university-logo.png";

function ForceChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      const role = getStoredRole();
      navigate(getRoleHomePath(role), { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0] ||
        err?.message ||
        "Failed to change password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#f7f1e6] via-[#edf4ff] to-[#c7d7ff] text-[#0b2c4a] flex items-center justify-center">
      <div className="pointer-events-none absolute -top-28 -left-20 h-80 w-80 rounded-full bg-[#103c6b]/15 blur-3xl" />
      <div className="pointer-events-none absolute top-20 right-0 h-[26rem] w-[26rem] translate-x-1/2 rounded-full bg-[#ffcf70]/35 blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="rounded-3xl bg-white/85 p-8 shadow-2xl ring-1 ring-white/60 backdrop-blur">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-20 w-20 rounded-full bg-[#0b2c4a] p-[3px] shadow-lg mb-4">
              <div className="h-full w-full rounded-full bg-white p-2">
                <img src={BigLogo} alt="University logo" className="h-full w-full object-contain" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-[#0b2c4a] font-['Palatino_Linotype','Book_Antiqua','Palatino','serif']">
              Set Your New Password
            </h2>
            <p className="mt-2 text-sm text-[#1d3557]/70">
              For your security, please change your temporary password before continuing.
            </p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d3557]/70">
                Temporary Password
              </label>
              <input
                type="password"
                placeholder="Your temporary password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="mt-2 w-full rounded-2xl border border-[#0b2c4a]/15 bg-white/90 px-4 py-3 text-sm text-[#0b2c4a] shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d3557]/70">
                New Password
              </label>
              <input
                type="password"
                placeholder="Choose a new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="mt-2 w-full rounded-2xl border border-[#0b2c4a]/15 bg-white/90 px-4 py-3 text-sm text-[#0b2c4a] shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d3557]/70">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="mt-2 w-full rounded-2xl border border-[#0b2c4a]/15 bg-white/90 px-4 py-3 text-sm text-[#0b2c4a] shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
              />
            </div>

            {error ? (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#0b2c4a] via-[#1d5fa3] to-[#0b2c4a] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-lg transition hover:translate-y-[-1px] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
                  Saving…
                </>
              ) : (
                "Set New Password"
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default ForceChangePassword;
