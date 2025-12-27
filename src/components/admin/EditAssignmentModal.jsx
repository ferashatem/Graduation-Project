import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from "@mui/material";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { getErrorMessage } from "../../utils/errorHelpers";

function EditAssignmentModal({
  open,
  assignment,
  courseLabel,
  professors = [],
  assistants = [],
  onClose,
  onSaved,
}) {
  const assignmentId = assignment?.id;
  const assignmentRef = useMemo(
    () =>
      assignmentId ? doc(db, "courseAssignments", assignmentId) : undefined,
    [assignmentId, db]
  );

  const [selectedProfessorIds, setSelectedProfessorIds] = useState([]);
  const [selectedAssistantIds, setSelectedAssistantIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedProfessorIds(assignment?.professorIds || []);
    setSelectedAssistantIds(assignment?.assistantIds || []);
    setError("");
  }, [assignment, open]);

  const toggleProfessor = useCallback((profId) => {
    setSelectedProfessorIds((prev) =>
      prev.includes(profId) ? prev.filter((id) => id !== profId) : [...prev, profId]
    );
  }, []);

  const toggleAssistant = useCallback((assistantId) => {
    setSelectedAssistantIds((prev) =>
      prev.includes(assistantId)
        ? prev.filter((id) => id !== assistantId)
        : [...prev, assistantId]
    );
  }, []);

  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  const handleSave = useCallback(async () => {
    if (!assignmentRef) return;
    setSaving(true);
    setError("");

    try {
      const payload = {
        professorIds: selectedProfessorIds,
        assistantIds: selectedAssistantIds,
      };
      await updateDoc(assignmentRef, payload);
      if (onSaved) {
        onSaved({ id: assignmentId, ...payload });
      }
      if (onClose) onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [
    assignmentId,
    assignmentRef,
    onClose,
    onSaved,
    selectedAssistantIds,
    selectedProfessorIds,
  ]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Assignment</DialogTitle>
      <DialogContent className="space-y-4">
        {courseLabel ? (
          <div className="text-sm font-medium text-slate-600">{courseLabel}</div>
        ) : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="text-sm font-semibold text-slate-700">Professors</div>
            {professors.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No professors found.</p>
            ) : (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {professors.map((prof) => (
                  <label
                    key={prof.id}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedProfessorIds.includes(prof.id)}
                      onChange={() => toggleProfessor(prof.id)}
                    />
                    <span>
                      <span className="font-medium">
                        {prof.displayName || "Unnamed professor"}
                      </span>
                      {prof.email ? (
                        <span className="block text-xs text-slate-500">
                          {prof.email}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="text-sm font-semibold text-slate-700">Assistants</div>
            {assistants.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No assistants found.</p>
            ) : (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {assistants.map((assistant) => (
                  <label
                    key={assistant.id}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedAssistantIds.includes(assistant.id)}
                      onChange={() => toggleAssistant(assistant.id)}
                    />
                    <span>
                      <span className="font-medium">
                        {assistant.displayName || "Unnamed assistant"}
                      </span>
                      {assistant.email ? (
                        <span className="block text-xs text-slate-500">
                          {assistant.email}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditAssignmentModal;
