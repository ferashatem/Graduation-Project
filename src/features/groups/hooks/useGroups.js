import { useCallback, useEffect, useState } from "react";
import {
  fetchGroupsByBatch,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../api/groupsApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

// batchId — ULID for fetching; batchCode — public code for create/update
export const useGroups = (batchId, batchCode) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!batchId) { setGroups([]); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const data = await fetchGroupsByBatch(batchId);
      setGroups(data.map((d) => ({ ...d, id: d.id ?? d.code })));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => { load(); }, [load]);

  const addGroup = useCallback(async ({ name, code }) => {
    try {
      await createGroup({ name, code, batchCode });
      await load();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  }, [batchCode, load]);

  const editGroup = useCallback(async (groupCode, { name, code }) => {
    try {
      await updateGroup(groupCode, { name, code, batchCode });
      await load();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  }, [batchCode, load]);

  const removeGroup = useCallback(async (groupCode) => {
    try {
      await deleteGroup(groupCode);
      await load();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  }, [load]);

  return {
    groups, loading, error,
    reload: load,
    addGroup,
    updateGroup: editGroup,
    deleteGroup: removeGroup,
  };
};
