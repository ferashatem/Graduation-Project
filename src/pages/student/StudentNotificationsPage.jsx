import { useTranslation } from "react-i18next";
import { useNotifications } from "../../context/NotificationContext";

const fmtDate = (s) => {
  if (!s) return "";
  try { return new Date(s).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }); }
  catch { return s; }
};

function StudentNotificationsPage() {
  const { t } = useTranslation();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();

  return (
    <div className="space-y-5">
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

      {loading && (
        <div className="py-12 text-center text-sm text-slate-400">{t("notifications.loading")}</div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-slate-200 shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-500">{t("notifications.noNotifications")}</p>
          <p className="text-xs text-slate-400 mt-1">{t("notifications.emptyHint")}</p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`rounded-2xl p-4 ring-1 transition cursor-pointer ${
                n.isRead
                  ? "bg-white ring-slate-100"
                  : "bg-blue-50 ring-blue-200 hover:bg-blue-100"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {!n.isRead && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  )}
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
      )}
    </div>
  );
}

export default StudentNotificationsPage;
