import { useCallback, useEffect, useState } from "react";
import {
  createCollege,
  deleteCollege,
  fetchColleges,
  updateCollege,
} from "../api/collegesApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

export const useColleges = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadColleges = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchColleges();
      setColleges(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadColleges();
  }, [loadColleges]);

  const addCollege = useCallback(async (payload) => {
    setError("");
    try {
      const created = await createCollege(payload);
      setColleges((prev) => [created, ...prev]);
      return { ok: true };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { ok: false, error: message };
    }
  }, []);

  const editCollege = useCallback(
    async (collegeId, updates) => {
      const previous = colleges;
      setColleges((prev) =>
        prev.map((college) =>
          college.id === collegeId ? { ...college, ...updates } : college
        )
      );
      try {
        await updateCollege(collegeId, updates);
        return { ok: true };
      } catch (err) {
        const message = getErrorMessage(err);
        setColleges(previous);
        setError(message);
        return { ok: false, error: message };
      }
    },
    [colleges]
  );

  const removeCollege = useCallback(
    async (collegeId) => {
      const previous = colleges;
      setColleges((prev) => prev.filter((college) => college.id !== collegeId));
      try {
        await deleteCollege(collegeId);
        return { ok: true };
      } catch (err) {
        const message = getErrorMessage(err);
        setColleges(previous);
        setError(message);
        return { ok: false, error: message };
      }
    },
    [colleges]
  );

  return {
    colleges,
    loading,
    error,
    reload: loadColleges,
    addCollege,
    updateCollege: editCollege,
    deleteCollege: removeCollege,
  };
};
