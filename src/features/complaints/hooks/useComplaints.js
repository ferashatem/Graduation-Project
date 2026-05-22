import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../../../utils/errorHelpers";
import {
  createComplaint,
  fetchAllComplaints,
  fetchClusters,
  fetchMyComplaints,
  fetchMyReports,
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

  const load = useCallback(async (q = {}) => {
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
  }, []);

  useEffect(() => { load(); }, [load]);

  return { complaints: data.items, totalCount: data.totalCount, loading, error, reload: load };
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

  return { clusters, loading, error, reload: load };
};
