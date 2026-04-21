
import { useCallback, useEffect, useState } from "react";
import {
  createDepartment,
  deleteDepartment,
  fetchDepartmentsByCollege,
  updateDepartment,
} from "../api/departmentsApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

export const useDepartments = (collegeId, collegeCode) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDepartments = useCallback(async () => {
    if (!collegeId) {
      setDepartments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchDepartmentsByCollege(collegeId);
      const normalised = data.map((d) => ({ ...d, id: d.id ?? d.code }));
      setDepartments(normalised);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const addDepartment = useCallback(
    async (payload) => {
      try {
        await createDepartment({ ...payload, collegeCode });
        return { ok: true };
      } catch (err) {
        const message = getErrorMessage(err);
        return { ok: false, error: message };
      }
    },
    [collegeCode]
  );

  const editDepartment = useCallback(async (departmentCode, updates) => {
    try {
      await updateDepartment(departmentCode, { ...updates, collegeCode });
      return { ok: true };
    } catch (err) {
      const message = getErrorMessage(err);
      return { ok: false, error: message };
    }
  }, [collegeCode]);

  const removeDepartment = useCallback(async (departmentCode) => {
    try {
      await deleteDepartment(departmentCode);
      return { ok: true };
    } catch (err) {
      const message = getErrorMessage(err);
      return { ok: false, error: message };
    }
  }, []);

  return {
    departments,
    loading,
    error,
    reload: loadDepartments,
    addDepartment,
    updateDepartment: editDepartment,
    deleteDepartment: removeDepartment,
  };
};
