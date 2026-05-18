
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createCollege,
  deleteCollege,
  fetchColleges,
  fetchUniversity,
  updateCollege,
} from "../api/collegesApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

export const useColleges = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const universityIdRef = useRef(null);

  const loadColleges = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [data, university] = await Promise.all([fetchColleges(), fetchUniversity()]);
      universityIdRef.current = university?.id ?? null;
      const normalised = data.map((c) => ({ ...c, id: c.id ?? c.code }));
      setColleges(normalised);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadColleges();
  }, [loadColleges]);

  const addCollege = useCallback(async ({ name, code }) => {
    setError("");
    try {
      await createCollege({ name, code, universityId: universityIdRef.current });
      await loadColleges();
      return { ok: true };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { ok: false, error: message };
    }
  }, [loadColleges]);

  const editCollege = useCallback(
    async (collegeId, { name, code }) => {
      try {
        await updateCollege(collegeId, { name, code, universityId: universityIdRef.current });
        await loadColleges();
        return { ok: true };
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        return { ok: false, error: message };
      }
    },
    [loadColleges]
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
