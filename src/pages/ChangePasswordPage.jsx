import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../api/authApi";
import { getRoleHomePath, getStoredRole } from "../auth/session";
import { getErrorMessage } from "../utils/errorHelpers";

function ChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      if (newPassword !== confirm) {
        setError("New passwords do not match.");
        return;
      }
      if (newPassword.length < 8) {
        setError("New password must be at least 8 characters.");
        return;
      }
      setLoading(true);
      try {
        await changePassword({ currentPassword, newPassword });
        navigate(getRoleHomePath(getStoredRole()), { replace: true });
      } catch (err) {
        setError(getErrorMessage(err, "Failed to change password."));
      } finally {
        setLoading(false);
      }
    },
    [currentPassword, newPassword, confirm, navigate],
  );

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#f7f1e6] via-[#edf4ff] to-[#c7d7ff] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl bg-white/90 p-8 shadow-2xl ring-1 ring-white/60 backdrop-blur">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-[#0b2c4a] font-['Palatino_Linotype','Book_Antiqua','Palatino','serif']">
            Change Password
          </h1>
          <p className="mt-2 text-sm text-[#1d3557]/70">
            You must set a new password before continuing.
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d3557]/70">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-2 w-full rounded-2xl border border-[#0b2c4a]/15 bg-white/90 px-4 py-3 text-sm text-[#0b2c4a] shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d3557]/70">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="mt-2 w-full rounded-2xl border border-[#0b2c4a]/15 bg-white/90 px-4 py-3 text-sm text-[#0b2c4a] shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d3557]/70">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
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
    </section>
  );
}

export default ChangePasswordPage;
