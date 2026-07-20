import { useCallback, useEffect, useState } from "react";
import {
  fetchBatchesByDepartment,
  createBatch,
  updateBatch,
  deleteBatch,
} from "../api/batchesApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

export const useBatches = (departmentId) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!departmentId) { setBatches([]); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const data = await fetchBatchesByDepartment(departmentId);
      // id for DataGrid key; code used for PUT/DELETE
      setBatches(data.map((d) => ({ ...d, id: d.id ?? d.code })));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => { load(); }, [load]);

  const addBatch = useCallback(async ({ name, code }) => {
    try {
      await createBatch({ name, code, departmentId });
      await load();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  }, [departmentId, load]);

  const editBatch = useCallback(async (batchId, { name, code }) => {
    try {
      await updateBatch(batchId, { name, code, departmentId });
      await load();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  }, [departmentId, load]);

  const removeBatch = useCallback(async (batchId) => {
    try {
      await deleteBatch(batchId);
      await load();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  }, [load]);

  return {
    batches, loading, error,
    reload: load,
    addBatch,
    updateBatch: editBatch,
    deleteBatch: removeBatch,
  };
};
