import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { getErrorMessage } from "../../utils/errorHelpers";

const formatUserLabel = (user) =>
  user?.name || user?.fullName || user?.displayName || user?.email || "Unnamed";

function EditAssignmentModal({
  open,
  assignment,
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

  const [courseName, setCourseName] = useState("");
  const [termId, setTermId] = useState("");
  const [termLabel, setTermLabel] = useState("");
  const [selectedProfessorIds, setSelectedProfessorIds] = useState([]);
  const [selectedAssistantIds, setSelectedAssistantIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setCourseName(assignment?.CourseName || assignment?.courseName || "");
    setTermId(assignment?.termId || "");
    setTermLabel(assignment?.termLabel || "");
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

    const trimmedCourseName = courseName.trim();
    const trimmedTermId = termId.trim();
    const trimmedTermLabel = termLabel.trim();

    if (!trimmedCourseName || !trimmedTermId) {
      setError("Course name and term ID are required.");
      setSaving(false);
      return;
    }

    try {
      // Only update the editable fields.
      const payload = {
        CourseName: trimmedCourseName,
        termId: trimmedTermId,
        termLabel: trimmedTermLabel,
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
    courseName,
    onClose,
    onSaved,
    selectedAssistantIds,
    selectedProfessorIds,
    termId,
    termLabel,
  ]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Assignment</DialogTitle>
      <DialogContent className="space-y-4">
        {error ? <Alert severity="error">{error}</Alert> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Course Name
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              type="text"
              value={courseName}
              onChange={(event) => setCourseName(event.target.value)}
              placeholder="Course name"
              required
              disabled={saving}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Term ID
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              type="text"
              value={termId}
              onChange={(event) => setTermId(event.target.value)}
              placeholder="2025-fall"
              required
              disabled={saving}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            Term Label
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              type="text"
              value={termLabel}
              onChange={(event) => setTermLabel(event.target.value)}
              placeholder="Fall 2025"
              disabled={saving}
            />
          </label>
        </div>

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
                      disabled={saving}
                    />
                    <span>
                      <span className="font-medium">{formatUserLabel(prof)}</span>
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
                      disabled={saving}
                    />
                    <span>
                      <span className="font-medium">
                        {formatUserLabel(assistant)}
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
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !assignmentRef}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditAssignmentModal;
