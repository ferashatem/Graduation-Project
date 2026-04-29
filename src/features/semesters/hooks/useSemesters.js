import { useCallback, useEffect, useState } from "react";
import {
  fetchSemestersByYear,
  createSemester,
  updateSemester,
  deleteSemester,
} from "../api/semestersApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

export const useSemesters = (academicYearId) => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!academicYearId) { setSemesters([]); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const data = await fetchSemestersByYear(academicYearId);
      setSemesters(data.map((d) => ({ ...d, id: d.id ?? d.code })));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [academicYearId]);

  useEffect(() => { load(); }, [load]);

  const addSemester = useCallback(async ({ name, startDate, endDate }) => {
    try {
      await createSemester({ name, academicYearId, startDate, endDate });
      await load();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  }, [academicYearId, load]);

  const editSemester = useCallback(async (semesterId, { name, startDate, endDate }) => {
    try {
      await updateSemester(semesterId, { name, startDate, endDate });
      await load();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  }, [load]);

  const removeSemester = useCallback(async (semesterId) => {
    try {
      await deleteSemester(semesterId);
      await load();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  }, [load]);

  return {
    semesters, loading, error,
    reload: load,
    addSemester,
    updateSemester: editSemester,
    deleteSemester: removeSemester,
  };
};
