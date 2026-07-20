
// src/pages/SignIn.jsx
import { useCallback, useState } from "react";
import "../assets/styles/styles.css";
import { useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import {
  clearStoredSession,
  getRoleHomePath,
  persistAuthSession,
} from "../auth/session";
import { refreshAuthUser, resetAuthUser } from "../auth/useAuthUser";
import LanguageSwitcher from "../components/common/LanguageSwitcher";

import BigLogo from "../assets/university-logo.png";

const API_BASE = "https://universitymanagementsystem-production-e58e.up.railway.app";

function redirectByRole(role, navigate) {
  navigate(getRoleHomePath(role), { replace: true });
}

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function SignIn() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoginError("");
      setLoading(true);

      try {
        const res = await fetch(`${API_BASE}/api/Auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const json = await res.json();
        const authPayload = json?.data ?? json;

        if (!res.ok || !authPayload?.token) {
          const errMsg =
            (res.status === 401
              ? typeof json?.data === "string" ? json.data : null
              : null) ||
            json?.errors?.[0] ||
            json?.message ||
            t("signin.invalidCredentials");
          throw new Error(errMsg);
        }

        clearStoredSession();
        resetAuthUser();
        const session = persistAuthSession(json, {
          email,
          fullName: email.split("@")[0],
        });

        await refreshAuthUser();

        if (authPayload.requiresPasswordChange) {
          navigate("/change-password", { replace: true });
          return;
        }

        redirectByRole(session?.role, navigate);
      } catch (err) {
        setLoginError(err.message || t("signin.loginFailed"));
      } finally {
        setLoading(false);
      }
    },
    [email, password, navigate, t],
  );

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div
        className="hidden lg:flex lg:w-[55%] xl:w-[60%] flex-col relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0b2c4a 0%, #1a4a6b 40%, #0d6b8a 100%)",
        }}
      >
        {/* Building silhouette background */}
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 800 600" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect x="50" y="200" width="120" height="400" fill="white" />
            <rect x="60" y="150" width="100" height="60" fill="white" />
            <rect x="200" y="280" width="80" height="320" fill="white" />
            <rect x="320" y="180" width="160" height="420" fill="white" />
            <rect x="340" y="120" width="120" height="70" fill="white" />
            <rect x="510" y="240" width="100" height="360" fill="white" />
            <rect x="640" y="300" width="90" height="300" fill="white" />
            <rect x="30" y="220" width="20" height="380" fill="white" />
            <rect x="180" y="220" width="20" height="380" fill="white" />
            {/* Windows */}
            {[70,90,110,130].map(x => [220,260,300,340,380,420,460].map(y => (
              <rect key={`${x}-${y}`} x={x} y={y} width="12" height="16" fill="white" opacity="0.8" />
            )))}
            {[330,360,390,420,450].map(x => [200,240,280,320,360,400,440,480].map(y => (
              <rect key={`${x}-${y}`} x={x} y={y} width="14" height="18" fill="white" opacity="0.8" />
            )))}
          </svg>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0b2c4a]/80" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Top: Logo + University Name */}
          <div className="flex items-center gap-3 mb-auto">
            <img src={BigLogo} alt="University Logo" className="h-12 w-12 object-contain" />
            <div>
              <p className="text-white font-bold text-lg leading-tight">{t("signin.uniName1")}</p>
              <p className="text-white font-bold text-lg leading-tight">{t("signin.uniName2")}</p>
            </div>
          </div>

          {/* Middle: Main heading */}
          <div className="mt-auto mb-8">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-3">
              <Trans i18nKey="signin.uniFull" components={{ br: <br /> }} />
            </h1>
            <p className="text-[#4dd8e8] text-xl font-semibold mb-4">{t("signin.tagline")}</p>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
              {t("signin.intro")}
            </p>

            <div className="mt-6 flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3 max-w-xs">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{t("signin.officialAccess")}</p>
                <p className="text-white/60 text-xs">{t("signin.officialAccessDesc")}</p>
              </div>
            </div>
          </div>

          {/* Bottom: Feature strip */}
          <div className="grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
            {[
              { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", title: t("signin.featSecureTitle"), desc: t("signin.featSecureDesc") },
              { icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", title: t("signin.featServicesTitle"), desc: t("signin.featServicesDesc") },
              { icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", title: t("signin.featUpdatesTitle"), desc: t("signin.featUpdatesDesc") },
            ].map((f) => (
              <div key={f.title}>
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                  </svg>
                </div>
                <p className="text-white text-xs font-semibold">{f.title}</p>
                <p className="text-white/50 text-[11px] mt-0.5 leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f4f8] px-6 py-10">
        <div className="w-full max-w-md flex justify-end mb-2">
          <LanguageSwitcher variant="text" />
        </div>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-7">
              <div className="w-20 h-20 rounded-full border-4 border-[#0b2c4a] p-1 mb-4">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-1">
                  <img src={BigLogo} alt="University Logo" className="h-full w-full object-contain" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[#0b2c4a]">{t("signin.welcomeBack")}</h2>
              <p className="text-slate-500 text-sm mt-1">{t("signin.subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                  {t("signin.email")}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("signin.emailPlaceholder")}
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:ring-2 focus:ring-[#0b2c4a]/10 focus:bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                  {t("signin.password")}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none transition focus:border-[#0b2c4a]/40 focus:ring-2 focus:ring-[#0b2c4a]/10 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0b2c4a] accent-[#0b2c4a]"
                  />
                  <span className="text-sm text-slate-600">{t("signin.rememberMe")}</span>
                </label>
                <button type="button" className="text-sm text-[#1d5fa3] font-medium hover:underline">
                  {t("signin.forgotPassword")}
                </button>
              </div>

              {loginError && (
                <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
                  {loginError}
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#0b2c4a] text-white font-bold text-sm uppercase tracking-widest transition hover:bg-[#153a63] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {t("signin.signingIn")}
                  </>
                ) : t("signin.signInBtn")}
              </button>

              {/* OR Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">{t("signin.or")}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Microsoft Button */}
              <button
                type="button"
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 flex items-center justify-center gap-3 transition hover:bg-slate-50 hover:border-slate-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                {t("signin.signInMicrosoft")}
              </button>
            </form>

            {/* Footer note */}
            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-slate-50 px-4 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-xs text-slate-500 leading-relaxed">
                <Trans i18nKey="signin.footerNote" components={{ br: <br /> }} />
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            {t("signin.copyright")}
          </p>
          <div className="flex justify-center gap-4 mt-2">
            {[t("signin.privacyPolicy"), t("signin.termsConditions"), t("signin.helpCenter")].map((label) => (
              <button key={label} type="button" className="text-xs text-slate-400 hover:text-slate-600 transition">{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
