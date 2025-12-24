import React, { useCallback, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";
import BigLogo from "../../assets/university-logo.png";

function CreateAdminUser() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleCreateAccount = useCallback(
    async (e) => {
      e.preventDefault();
      setFormError("");
      setSuccessMessage("");

      if (!email || !password) {
        setFormError("Email and password are required.");
        return;
      }

      if (password !== confirmPassword) {
        setFormError("Passwords do not match.");
        return;
      }

      setLoading(true);

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(
          doc(db, "users", user.uid),
          {
            uid: user.uid,
            email: user.email || email,
            role,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );

        setSuccessMessage("Account created successfully.");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setRole("student");
      } catch (error) {
        console.error("Create account error:", error.message);
        setFormError(error.message || "Account creation failed.");
      } finally {
        setLoading(false);
      }
    },
    [email, password, confirmPassword, role]
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b2c4a]/10">
          <img src={BigLogo} alt="Benis Suef National University logo" className="h-8 w-8 object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[#0b2c4a]">Create Account</h1>
          <p className="text-sm text-slate-600">
            Add a new user account from the admin console. Credentials are stored in Firebase Auth and Firestore.
          </p>
        </div>
      </div>

      <form
        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        onSubmit={handleCreateAccount}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="admin-email" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="admin-role" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Role
            </label>
            <select
              id="admin-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
              required
            >
              <option value="student">Student</option>
              <option value="assistant">Assistant</option>
              <option value="professor">Professor</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div>
            <label htmlFor="admin-password" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-confirm" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Confirm Password
            </label>
            <input
              id="admin-confirm"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
              required
            />
          </div>
        </div>

        {formError ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700" role="alert">
            {formError}
          </div>
        ) : null}

        {successMessage ? (
          <div
            className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700"
            role="status"
          >
            {successMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-3 rounded-2xl bg-[#0b2c4a] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-lg transition hover:translate-y-[-1px] hover:bg-[#153a63] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
                Creating
              </>
            ) : (
              "Create Account"
            )}
          </button>
          <span className="text-xs text-slate-500">
            The new user can sign in immediately after creation.
          </span>
        </div>
      </form>
    </div>
  );
}

export default CreateAdminUser;
