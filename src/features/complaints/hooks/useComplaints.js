import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../../../utils/errorHelpers";
import {
  createComplaint,
  fetchAllComplaints,
  fetchClusterDetail,
  fetchClusters,
  fetchComplaintDashboard,
  fetchMyComplaints,
  fetchMyReports,
  replyToCluster,
  replyToComplaint,
  updateClusterStatus,
} from "../api/complaintsApi";

const normalizeList = (payload) => {
  if (!payload) return { items: [], totalCount: 0 };
  if (Array.isArray(payload)) return { items: payload, totalCount: payload.length };
  return { items: payload.items ?? [], totalCount: payload.totalCount ?? 0 };
};

export const useStudentComplaints = () => {
  const [data, setData] = useState({ items: [], totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState({ page: 1, pageSize: 20 });

  const load = useCallback(async (q = query) => {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchMyComplaints(q);
      setData(normalizeList(payload));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const submitComplaint = useCallback(async (dto) => {
    try {
      const created = await createComplaint(dto);
      setData((prev) => ({ ...prev, items: [created, ...prev.items], totalCount: prev.totalCount + 1 }));
      return { ok: true, data: created };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  }, []);

  return { complaints: data.items, totalCount: data.totalCount, loading, error, reload: load, submitComplaint, setQuery };
};

export const useDoctorReports = () => {
  const [data, setData] = useState({ items: [], totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState({ page: 1, pageSize: 20 });

  const load = useCallback(async (q = query) => {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchMyReports(q);
      setData(normalizeList(payload));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const setStatusFilter = useCallback((status) => {
    setQuery((prev) => ({ ...prev, page: 1, status: status || undefined }));
  }, []);

  const statusFilter = query.status ?? "";

  const reply = useCallback(async (id, replyText) => {
    try {
      const updated = await replyToComplaint(id, replyText);
      setData((prev) => ({
        ...prev,
        items: prev.items.map((c) => (c.id === id ? { ...c, ...updated, status: "Resolved" } : c)),
      }));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  }, []);

  const pendingCount = data.items.filter((c) => c.status === "Pending").length;

  return { complaints: data.items, totalCount: data.totalCount, loading, error, reload: load, reply, statusFilter, setStatusFilter, setQuery, page: query.page, pageSize: query.pageSize, pendingCount };
};

export const usePendingComplaintsCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchMyReports({ status: "Pending", pageSize: 50 })
      .then((payload) => {
        const { items } = normalizeList(payload);
        setCount(items.length);
      })
      .catch(() => {});
  }, []);

  return count;
};

export const useAdminComplaints = () => {
  const [data, setData] = useState({ items: [], totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState({ page: 1, pageSize: 20 });

  const load = useCallback(async (q = query) => {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchAllComplaints(q);
      setData(normalizeList(payload));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { load(); }, [load]);

  return { complaints: data.items, totalCount: data.totalCount, loading, error, reload: load, setQuery };
};

export const useComplaintClusters = ({ targetType, targetId } = {}) => {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchClusters({ targetType, targetId });
      setClusters(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => { load(); }, [load]);

  const replyCluster = useCallback(async (clusterId, message) => {
    try {
      const result = await replyToCluster(clusterId, message);
      setClusters((prev) => prev.map((c) => c.id === clusterId ? { ...c, status: "Resolved" } : c));
      return { ok: true, data: result };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  }, []);

  const changeClusterStatus = useCallback(async (clusterId, status, reason) => {
    try {
      await updateClusterStatus(clusterId, status, reason);
      setClusters((prev) => prev.map((c) => c.id === clusterId ? { ...c, status } : c));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  }, []);

  return { clusters, loading, error, reload: load, replyCluster, changeClusterStatus };
};

export const useComplaintDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchComplaintDashboard();
      setDashboard(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { dashboard, loading, error, reload: load };
};

export const useClusterDetail = (clusterId) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!clusterId) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchClusterDetail(clusterId);
      setDetail(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clusterId]);

  useEffect(() => { load(); }, [load]);

  return { detail, loading, error, reload: load };
};
