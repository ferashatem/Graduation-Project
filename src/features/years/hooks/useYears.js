import { useCallback, useEffect, useState } from "react";
import {
  createYear,
  deleteYear,
  fetchYears,
  updateYear,
} from "../api/yearsApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

export const useYears = (collegeId) => {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadYears = useCallback(async () => {
    if (!collegeId) {
      setYears([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await fetchYears(collegeId);
      setYears(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => {
    loadYears();
  }, [loadYears]);

  const addYear = useCallback(
    async (payload) => {
      setError("");
      try {
        const created = await createYear(collegeId, payload);
        setYears((prev) => [...prev, created]);
        return { ok: true };
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        return { ok: false, error: message };
      }
    },
    [collegeId]
  );

  const editYear = useCallback(
    async (yearId, updates) => {
      const previous = years;
      setYears((prev) =>
        prev.map((year) => (year.id === yearId ? { ...year, ...updates } : year))
      );
      try {
        await updateYear(collegeId, yearId, updates);
        return { ok: true };
      } catch (err) {
        const message = getErrorMessage(err);
        setYears(previous);
        setError(message);
        return { ok: false, error: message };
      }
    },
    [collegeId, years]
  );

  const removeYear = useCallback(
    async (yearId) => {
      const previous = years;
      setYears((prev) => prev.filter((year) => year.id !== yearId));
      try {
        await deleteYear(collegeId, yearId);
        return { ok: true };
      } catch (err) {
        const message = getErrorMessage(err);
        setYears(previous);
        setError(message);
        return { ok: false, error: message };
      }
    },
    [collegeId, years]
  );

  return {
    years,
    loading,
    error,
    reload: loadYears,
    addYear,
    updateYear: editYear,
    deleteYear: removeYear,
  };
};
