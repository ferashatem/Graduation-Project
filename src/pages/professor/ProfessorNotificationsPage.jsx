import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../../context/NotificationContext";
import { sendToMyStudents } from "../../api/notificationsApi";
import { fetchMySubjects } from "../../features/professor/api/professorBackendApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const fmtDate = (s) => {
  if (!s) return "";
  try { return new Date(s).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }); }
  catch { return s; }
};

function ProfessorNotificationsPage() {
  const { t } = useTranslation();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();

  const [offerings, setOfferings]   = useState([]);
  const [sending,   setSending]     = useState(false);
  const [sendOk,    setSendOk]      = useState(false);
  const [sendErr,   setSendErr]     = useState("");
  const [form, setForm] = useState({ title: "", message: "", offeringId: "" });

  useEffect(() => {
    fetchMySubjects().then((data) => setOfferings(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSend = useCallback(async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    setSending(true); setSendOk(false); setSendErr("");
    try {
      await sendToMyStudents(
        { title: form.title.trim(), message: form.message.trim() },
        form.offeringId || undefined,
      );
      setSendOk(true);
      setForm({ title: "", message: "", offeringId: "" });
    } catch (err) {
      setSendErr(getErrorMessage(err, t("profNotifications.failedSend")));
    } finally {
      setSending(false);
    }
  }, [form, t]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("notifications.title")}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {unreadCount > 0 ? t("notifications.unread", { count: unreadCount }) : t("notifications.allCaughtUp")}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            {t("notifications.markAllRead")}
          </button>
        )}
      </div>

      {/* Send to students form */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-slate-800">{t("profNotifications.sendTitle")}</h2>
        </div>

        <form onSubmit={handleSend} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{t("profNotifications.title")} *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setF("title", e.target.value)}
                placeholder={t("profNotifications.titlePlaceholder")}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{t("profNotifications.selectOffering")}</label>
              <select
                value={form.offeringId}
                onChange={(e) => setF("offeringId", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300"
              >
                <option value="">{t("profNotifications.allOfferings")}</option>
                {offerings.map((o) => {
                  const id = o.id ?? o.subjectOfferingId;
                  const name = o.subjectName ?? o.name ?? t("profCourses.untitled");
                  return <option key={id} value={id}>{name} ({o.subjectCode ?? o.code ?? ""})</option>;
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{t("profNotifications.message")} *</label>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => setF("message", e.target.value)}
              placeholder={t("profNotifications.messagePlaceholder")}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>

          {sendErr && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-700 ring-1 ring-red-200">{sendErr}</p>
          )}
          {sendOk && (
            <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700 ring-1 ring-emerald-200">
              {t("profNotifications.sentSuccess")}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending || !form.title.trim() || !form.message.trim()}
              className="flex items-center gap-2 rounded-xl bg-[#0b2c4a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#153a63] disabled:opacity-50 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {sending ? t("profNotifications.sending") : t("profNotifications.send")}
            </button>
          </div>
        </form>
      </div>

      {/* Received notifications */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("notifications.title")}</h2>

        {loading && (
          <div className="py-8 text-center text-sm text-slate-400">{t("common.loading")}</div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">{t("notifications.noNotifications")}</p>
          </div>
        )}

        {!loading && notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.isRead && markRead(n.id)}
            className={`rounded-2xl p-4 ring-1 transition cursor-pointer ${
              n.isRead ? "bg-white ring-slate-100" : "bg-blue-50 ring-blue-200 hover:bg-blue-100"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${n.isRead ? "text-slate-700" : "text-slate-900"}`}>
                    {n.title ?? t("notifications.notification")}
                  </p>
                  {n.message && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{fmtDate(n.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProfessorNotificationsPage;
