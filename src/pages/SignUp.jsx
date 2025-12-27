import React, { useCallback, useState } from "react";
import "../assets/styles/styles.css";
import { Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth } from "../firebase/firebaseConfig";
import { db } from "../firebase/firebaseConfig";
import BigLogo from "../assets/university-logo.png";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSignUp = useCallback(
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
        console.log("User created in Auth:", user.uid);
        await setDoc(
          doc(db, "Users", user.uid),
          {
            uid: user.uid,
            email: user.email || email,
            role: "student",
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
        setSuccessMessage("Account created. You can sign in now.");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } catch (error) {
        console.error("Sign up error:", error.message);
        setFormError(error.message || "Sign up failed.");
      } finally {
        setLoading(false);
      }
    },
    [email, password, confirmPassword]
  );

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#f7f1e6] via-[#edf4ff] to-[#c7d7ff] text-[#0b2c4a]">
      <div className="pointer-events-none absolute -top-28 -left-20 h-80 w-80 rounded-full bg-[#103c6b]/15 blur-3xl" />
      <div className="pointer-events-none absolute top-16 right-0 h-[26rem] w-[26rem] translate-x-1/2 rounded-full bg-[#ffcf70]/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#7fb0ff]/35 blur-3xl" />

      <div className="relative z-10 grid min-h-screen grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-16 lg:py-16">
        <div className="flex flex-col justify-center gap-8">
          <div className="inline-flex w-fit items-center gap-3 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#0b2c4a] shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0b2c4a]" />
            Account Access
          </div>

          <div className="max-w-xl">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[#0b2c4a] lg:text-5xl lg:leading-tight font-['Palatino_Linotype','Book_Antiqua','Palatino','serif']">
              Create your campus access
            </h1>
            <p className="mt-4 text-base text-[#1d3557]/80 lg:text-lg">
              No university email yet? Use any valid email address to create a portal account and we will connect you to
              the right services.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-white/60">
            <div className="h-14 w-14 rounded-2xl bg-white p-2 shadow-sm">
              <img src={BigLogo} alt="Benis Suef National University logo" className="h-full w-full object-contain" />
            </div>
            <div className="text-sm text-[#1d3557]/70">
              <p className="text-base font-semibold text-[#0b2c4a]">New Accounts Welcome</p>
              <p>Create a secure login to access the university portal.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-3xl bg-white/85 p-8 shadow-2xl ring-1 ring-white/60 backdrop-blur">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-[#0b2c4a] p-[3px] shadow-lg">
                <div className="h-full w-full rounded-full bg-white p-3">
                  <img src={BigLogo} alt="Benis Suef National University logo" className="h-full w-full object-contain" />
                </div>
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-[#0b2c4a] font-['Palatino_Linotype','Book_Antiqua','Palatino','serif']">
                Create Account
              </h2>
              <p className="mt-2 text-sm text-[#1d3557]/70">Set up your portal credentials to get started.</p>
            </div>

            <form className="mt-8 flex flex-col gap-5" onSubmit={handleSignUp}>
              <div>
                <label
                  htmlFor="signup-email"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d3557]/70"
                >
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="mt-2 w-full rounded-2xl border border-[#0b2c4a]/15 bg-white/90 px-4 py-3 text-sm text-[#0b2c4a] shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d3557]/70"
                >
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-2xl border border-[#0b2c4a]/15 bg-white/90 px-4 py-3 text-sm text-[#0b2c4a] shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="signup-confirm"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d3557]/70"
                >
                  Confirm Password
                </label>
                <input
                  id="signup-confirm"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-2xl border border-[#0b2c4a]/15 bg-white/90 px-4 py-3 text-sm text-[#0b2c4a] shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
                  required
                />
              </div>

              {formError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700" role="alert">
                  {formError}
                </div>
              ) : null}

              {successMessage ? (
                <div
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700"
                  role="status"
                >
                  {successMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#0b2c4a] via-[#1d5fa3] to-[#0b2c4a] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-lg transition hover:translate-y-[-1px] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
                    Creating Account
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#1d3557]/70">
              Already have an account?{" "}
              <Link
                to="/"
                className="font-semibold text-[#0b2c4a] underline decoration-[#0b2c4a]/40 underline-offset-4"
              >
                Sign in here
              </Link>
            </div>

            <div className="mt-6 rounded-2xl bg-[#0b2c4a]/5 px-4 py-3 text-xs text-[#1d3557]/70">
              Use a secure password and keep it private. For help, contact the IT helpdesk.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SignUp;
