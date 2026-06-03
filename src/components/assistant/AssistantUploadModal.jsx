import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { createAssignmentMaterial } from "../../firebase/assignmentMaterialsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

function AssistantUploadModal({
  open,
  assistantId,
  assistantName,
  assignment,
  onClose,
  onCreated,
}) {
  const [lectureTitle, setLectureTitle] = useState("");
  const [lectureNumber, setLectureNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLectureTitle("");
    setLectureNumber("");
    setNotes("");
    setFile(null);
    setLocalError("");
  }, [open]);

  const handleClose = useCallback(() => {
    if (loading) return;
    if (onClose) onClose();
  }, [loading, onClose]);

  const handleFileChange = useCallback((event) => {
    const nextFile = event.target.files?.[0] || null;
    setLocalError("");
    if (!nextFile) { setFile(null); return; }
    const isPdf =
      nextFile.type === "application/pdf" ||
      nextFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) { setLocalError("Please upload a PDF file."); setFile(null); return; }
    setFile(nextFile);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!assistantId) { setLocalError("Assistant session is missing."); return; }
    if (!assignment?.id) { setLocalError("Assignment is missing."); return; }
    const trimmedTitle = lectureTitle.trim();
    if (!trimmedTitle) { setLocalError("Lecture title is required."); return; }
    if (!file) { setLocalError("PDF file is required."); return; }

    let numericLecture = null;
    if (lectureNumber !== "") {
      const parsed = Number(lectureNumber);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setLocalError("Lecture number must be a positive number.");
        return;
      }
      numericLecture = parsed;
    }

    setLoading(true);
    setLocalError("");
    try {
      const created = await createAssignmentMaterial({
        assignmentId: assignment.id,
        uploaderId: assistantId,
        uploaderName: assistantName || "",
        courseId: assignment.courseId || "",
        courseName: assignment.courseName || assignment.CourseName || "",
        lectureTitle: trimmedTitle,
        lectureNumber: numericLecture,
        notes: notes.trim(),
        file,
      });
      if (onCreated) onCreated(created);
      if (onClose) onClose();
    } catch (err) {
      setLocalError(getErrorMessage(err, "Failed to upload material."));
    } finally {
      setLoading(false);
    }
  }, [
    assistantId,
    assistantName,
    assignment,
    file,
    lectureNumber,
    lectureTitle,
    notes,
    onClose,
    onCreated,
  ]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Section Material</DialogTitle>
      <DialogContent className="space-y-4">
        {localError ? <Alert severity="error">{localError}</Alert> : null}

        <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          <span>Course</span>
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {assignment?.courseName || assignment?.CourseName || "—"}
          </p>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Lecture Title *
          <input
            type="text"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            value={lectureTitle}
            onChange={(e) => setLectureTitle(e.target.value)}
            placeholder="e.g. Introduction to Algorithms"
            disabled={loading}
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Lecture Number (optional)
          <input
            type="number"
            min="1"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            value={lectureNumber}
            onChange={(e) => setLectureNumber(e.target.value)}
            placeholder="e.g. 3"
            disabled={loading}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Notes (optional)
          <textarea
            rows={3}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes…"
            disabled={loading}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          PDF File *
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
          />
          {file ? (
            <span className="text-xs text-slate-500">{file.name}</span>
          ) : null}
        </label>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? "Uploading…" : "Upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AssistantUploadModal;
