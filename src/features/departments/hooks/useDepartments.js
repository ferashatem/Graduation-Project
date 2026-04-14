import { useCallback, useEffect, useState } from "react";
import {
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  updateDepartment,
} from "../api/departmentsApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

export const useDepartments = (collegeId, yearId) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDepartments = useCallback(async () => {
    if (!collegeId || !yearId) {
      setDepartments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await fetchDepartments(collegeId, yearId);
      setDepartments(data);
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
      setError("");
      try {
        const created = await createDepartment(collegeId, yearId, payload);
        setDepartments((prev) => [created, ...prev]);
        return { ok: true };
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        return { ok: false, error: message };
      }
    },
    [collegeId, yearId]
  );

  const editDepartment = useCallback(
    async (departmentId, updates) => {
      const previous = departments;
      setDepartments((prev) =>
        prev.map((department) =>
          department.id === departmentId
            ? { ...department, ...updates }
            : department
        )
      );
      try {
        await updateDepartment(collegeId, yearId, departmentId, updates);
        return { ok: true };
      } catch (err) {
        const message = getErrorMessage(err);
        setDepartments(previous);
        setError(message);
        return { ok: false, error: message };
      }
    },
    [collegeId, departments, yearId]
  );

  const removeDepartment = useCallback(
    async (departmentId) => {
      const previous = departments;
      setDepartments((prev) =>
        prev.filter((department) => department.id !== departmentId)
      );
      try {
        await deleteDepartment(collegeId, yearId, departmentId);
        return { ok: true };
      } catch (err) {
        const message = getErrorMessage(err);
        setDepartments(previous);
        setError(message);
        return { ok: false, error: message };
      }
    },
    [collegeId, departments, yearId]
  );

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
