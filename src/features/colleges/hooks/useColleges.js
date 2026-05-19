
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
  const [hasUniversity, setHasUniversity] = useState(true);
  const universityIdRef = useRef(null);

  const loadColleges = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [data, university] = await Promise.all([fetchColleges(), fetchUniversity()]);
      universityIdRef.current = university?.id ?? null;
      setHasUniversity(Boolean(university?.id));
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

  const addCollege = useCallback(async ({ name, code, universityId }) => {
    const uid = universityId || universityIdRef.current;
    if (!uid) return { ok: false, error: "No university found. Please select a university." };
    try {
      await createCollege({ name, code, universityId: uid });
      await loadColleges();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  }, [loadColleges]);

  const editCollege = useCallback(
    async (collegeId, { name, code, universityId }) => {
      const uid = universityId || universityIdRef.current;
      try {
        await updateCollege(collegeId, { name, code, universityId: uid });
        await loadColleges();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: getErrorMessage(err) };
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
        setColleges(previous);
        return { ok: false, error: getErrorMessage(err) };
      }
    },
    [colleges]
  );

  return {
    colleges,
    loading,
    error,
    hasUniversity,
    reload: loadColleges,
    addCollege,
    updateCollege: editCollege,
    deleteCollege: removeCollege,
  };
};
