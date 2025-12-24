// src/pages/SignIn.jsx
import React, { useCallback, useMemo, useState } from "react";
import "../assets/styles/styles.css";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { useAuthUser } from "../auth/useAuthUser";

import BigLogo from "../assets/university-logo.png";

function SignIn() {
  const { user, authLoading } = useAuthUser();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const getRoleFromFirestore = useCallback(async (uid) => {
    if (!uid) return null;

    try {
      const collections = ["Users", "users"];

      for (const collectionName of collections) {
        const snap = await getDoc(doc(db, collectionName, uid));
        if (snap.exists()) {
          const data = snap.data();
          return data?.role || null;
        }
      }
    } catch (err) {
      console.error("Load role error:", err);
    }

    return null;
  }, []);

  // ✅ If already logged in, you can redirect
  const redirectIfLoggedIn = useCallback(async () => {
    if (!user) return;

    const roleFromDb = await getRoleFromFirestore(user.uid);
    const role = roleFromDb || "student";

    if (role === "super_admin") navigate("/superadmin/home", { replace: true });
    else if (role === "admin") navigate("/admin/home", { replace: true });
    else if (role === "professor") navigate("/professor/home", { replace: true });
    else if (role === "assistant") navigate("/assistant/home", { replace: true });
    // else navigate("/superadmin/home", { replace: true });
  }, [user, navigate, getRoleFromFirestore]);

  React.useEffect(() => {
    if (!authLoading && user) redirectIfLoggedIn();
  }, [authLoading, user, redirectIfLoggedIn]);

  const pageLoadingUI = useMemo(() => {
    return (
      <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#f7f1e6] via-[#edf4ff] to-[#c7d7ff]">
        <div className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-[#103c6b]/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-[#ffcf70]/30 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3 rounded-full bg-white/80 px-5 py-3 text-sm font-semibold text-[#0b2c4a] shadow-lg">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0b2c4a]/40 border-t-[#0b2c4a]" />
          Preparing your portal...
        </div>
      </section>
    );
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        // Firebase email/password sign-in :contentReference[oaicite:3]{index=3}
        const userCred = await signInWithEmailAndPassword(auth, email, password);

        const signedUser = userCred.user;

        const roleFromDb = await getRoleFromFirestore(signedUser.uid);
        const role = roleFromDb || "student";
        
        // Optional: store lightweight info locally (NOT security)
        const userName = signedUser.displayName || signedUser.email?.split("@")[0] || "User";
        localStorage.setItem("userName", userName);
        localStorage.setItem(
          "user",
          JSON.stringify({ uid: signedUser.uid, email: signedUser.email, role })
        );

        // ✅ Redirect based on real role
        if (role === "super_admin") navigate("/superadmin/home", { replace: true });
        else if (role === "admin") navigate("/admin/home", { replace: true });
        else if (role === "professor") navigate("/professor/home", { replace: true });
        else if (role === "assistant") navigate("/assistant/home", { replace: true });
        else navigate("/student/home", { replace: true });
      } catch (err) {
        console.error("Firebase SignIn Error:", err.code, err.message);
        alert("Login failed: " + err.message);
        setLoading(false);
      }
    },
    [email, password, navigate, getRoleFromFirestore]
  );

  if (authLoading) return pageLoadingUI;

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#f7f1e6] via-[#edf4ff] to-[#c7d7ff] text-[#0b2c4a]">
      <div className="pointer-events-none absolute -top-28 -left-20 h-80 w-80 rounded-full bg-[#103c6b]/15 blur-3xl" />
      <div className="pointer-events-none absolute top-20 right-0 h-[26rem] w-[26rem] translate-x-1/2 rounded-full bg-[#ffcf70]/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#7fb0ff]/35 blur-3xl" />

      <div className="relative z-10 grid min-h-screen grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-16 lg:py-16">
        <div className="flex flex-col justify-center gap-8">
          <div className="inline-flex w-fit items-center gap-3 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#0b2c4a] shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0b2c4a]" />
            College Portal
          </div>

          <div className="max-w-xl">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[#0b2c4a] lg:text-5xl lg:leading-tight font-['Palatino_Linotype','Book_Antiqua','Palatino','serif']">
              Benis Suef National University
            </h1>
            <p className="mt-4 text-base text-[#1d3557]/80 lg:text-lg">
              Sign in to reach student services, faculty resources, and campus announcements in one secure space.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-white/60">
            <div className="h-14 w-14 rounded-2xl bg-white p-2 shadow-sm">
              <img src={BigLogo} alt="Benis Suef National University logo" className="h-full w-full object-contain" />
            </div>
            <div className="text-sm text-[#1d3557]/70">
              <p className="text-base font-semibold text-[#0b2c4a]">Official College Access</p>
              <p>Use your university email to enter the portal.</p>
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
                Welcome Back
              </h2>
              <p className="mt-2 text-sm text-[#1d3557]/70">Sign in to continue to the college portal.</p>
            </div>

            <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d3557]/70">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@bnu.edu.eg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="mt-2 w-full rounded-2xl border border-[#0b2c4a]/15 bg-white/90 px-4 py-3 text-sm text-[#0b2c4a] shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d3557]/70"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-2xl border border-[#0b2c4a]/15 bg-white/90 px-4 py-3 text-sm text-[#0b2c4a] shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#0b2c4a] via-[#1d5fa3] to-[#0b2c4a] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-lg transition hover:translate-y-[-1px] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
                    Signing In
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-6 rounded-2xl bg-[#0b2c4a]/5 px-4 py-3 text-xs text-[#1d3557]/70">
              Use your official university credentials. For support, contact the IT helpdesk.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SignIn;
