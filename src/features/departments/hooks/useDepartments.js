
import { useCallback, useEffect, useState } from "react";
import {
  createDepartment,
  deleteDepartment,
  fetchDepartmentsByCollege,
  fetchDepartmentsByYear,
  updateDepartment,
} from "../api/departmentsApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

export const useDepartments = (collegeId, _collegeCode, yearId) => {
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
      const data = yearId
        ? await fetchDepartmentsByYear(yearId)
        : await fetchDepartmentsByCollege(collegeId);
      const normalised = data.map((d) => ({
        ...d,
        id: d.id ?? d.departmentId ?? d.mappingId ?? d.code,
        name: d.name ?? d.departmentName ?? "",
        code: d.code ?? d.departmentCode ?? "",
      }));
      setDepartments(normalised);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [collegeId, yearId]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const addDepartment = useCallback(
    async (payload) => {
      try {
        await createDepartment({ ...payload, collegeId, academicYearId: yearId ?? undefined });
        return { ok: true };
      } catch (err) {
        const message = getErrorMessage(err);
        return { ok: false, error: message };
      }
    },
    [collegeId, yearId]
  );

  const editDepartment = useCallback(async (departmentId, updates) => {
    try {
      await updateDepartment(departmentId, { ...updates, collegeId });
      return { ok: true };
    } catch (err) {
      const message = getErrorMessage(err);
      return { ok: false, error: message };
    }
  }, [collegeId]);

  const removeDepartment = useCallback(async (departmentId) => {
    try {
      await deleteDepartment(departmentId);
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
