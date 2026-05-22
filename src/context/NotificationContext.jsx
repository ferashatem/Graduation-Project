import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import {
  fetchMyNotifications,
  markNotificationRead,
} from "../api/notificationsApi";
import { getStoredAccessToken } from "../auth/session";

const HUB_URL = "https://universitymanagementsystem-production-e58e.up.railway.app/hubs/notifications";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const connectionRef = useRef(null);

  const syncFromServer = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) return;
    try {
      setLoading(true);
      const data = await fetchMyNotifications(false);
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch {
      // silently fail — non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.allSettled(unread.map((n) => markNotificationRead(n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, [notifications]);

  // SignalR setup
  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) return;

    // Initial load
    syncFromServer();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => getStoredAccessToken() })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("ReceiveNotification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    connection.onreconnected(() => {
      syncFromServer();
    });

    connectionRef.current = connection;

    connection.start().catch(() => {
      // connection failed — rely on REST polling
    });

    return () => {
      connection.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, markRead, markAllRead, syncFromServer }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
