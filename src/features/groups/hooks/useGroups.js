import { useCallback, useEffect, useState } from "react";
import {
  fetchGroupsByBatch,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../api/groupsApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

export const useGroups = (batchId) => {
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
      await createGroup({ name, code, batchId });
      await load();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  }, [batchId, load]);

  const editGroup = useCallback(async (groupId, { name, code }) => {
    try {
      await updateGroup(groupId, { name, code, batchId });
      await load();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  }, [batchId, load]);

  const removeGroup = useCallback(async (groupId) => {
    try {
      await deleteGroup(groupId);
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
