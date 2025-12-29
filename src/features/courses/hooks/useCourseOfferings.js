import { useCallback, useState } from "react";
import {
  assignInstructor,
  createOffering,
  listOfferings,
  unassignInstructor,
} from "../api/courseOfferingsApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

export const useCourseOfferings = () => {
  const [listLoading, setListLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOfferings = useCallback(async (payload) => {
    setListLoading(true);
    setError("");
    try {
      const data = await listOfferings(payload);
      return { ok: true, data };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { ok: false, error: message };
    } finally {
      setListLoading(false);
    }
  }, []);

  const createCourseOffering = useCallback(async (payload) => {
    setActionLoading(true);
    setError("");
    try {
      const data = await createOffering(payload);
      return { ok: true, data };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { ok: false, error: message };
    } finally {
      setActionLoading(false);
    }
  }, []);

  const assignCourseInstructor = useCallback(async (payload) => {
    setActionLoading(true);
    setError("");
    try {
      const data = await assignInstructor(payload);
      return { ok: true, data };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { ok: false, error: message };
    } finally {
      setActionLoading(false);
    }
  }, []);

  const unassignCourseInstructor = useCallback(async (payload) => {
    setActionLoading(true);
    setError("");
    try {
      const data = await unassignInstructor(payload);
      return { ok: true, data };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { ok: false, error: message };
    } finally {
      setActionLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  return {
    listLoading,
    actionLoading,
    error,
    clearError,
    loadOfferings,
    createOffering: createCourseOffering,
    assignInstructor: assignCourseInstructor,
    unassignInstructor: unassignCourseInstructor,
  };
};
