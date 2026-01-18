import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { createMaterialDoc } from "../../firebase/materialsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const resolveCourseName = (course) =>
  course?.courseName ||
  course?.CourseName ||
  course?.courseLabel ||
  "Untitled course";

function AddMaterialModal({
  open,
  professorId,
  courses = [],
  initialCourseDocId = "",
  onClose,
  onCreated,
}) {
  const [courseDocId, setCourseDocId] = useState("");
  const [lectureTitle, setLectureTitle] = useState("");
  const [lectureNumber, setLectureNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCourseDocId(initialCourseDocId || "");
    setLectureTitle("");
    setLectureNumber("");
    setNotes("");
    setFile(null);
    setLocalError("");
  }, [initialCourseDocId, open]);

  const courseOptions = useMemo(
    () => (Array.isArray(courses) ? courses : []),
    [courses]
  );

  const coursePlaceholder = useMemo(() => {
    if (courseOptions.length === 0) return "No courses available";
    return "Select a course";
  }, [courseOptions.length]);

  const handleClose = useCallback(() => {
    if (loading) return;
    if (onClose) onClose();
  }, [loading, onClose]);

  const handleFileChange = useCallback((event) => {
    const nextFile = event.target.files?.[0] || null;
    setLocalError("");
    if (!nextFile) {
      setFile(null);
      return;
    }

    const isPdf =
      nextFile.type === "application/pdf" ||
      nextFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setLocalError("Please upload a PDF file.");
      setFile(null);
      return;
    }

    setFile(nextFile);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!professorId) {
      setLocalError("Professor session is missing.");
      return;
    }

    const trimmedTitle = lectureTitle.trim();
    if (!courseDocId) {
      setLocalError("Course is required.");
      return;
    }
    if (!trimmedTitle) {
      setLocalError("Lecture title is required.");
      return;
    }
    if (!file) {
      setLocalError("PDF file is required.");
      return;
    }

    const selectedCourse = courseOptions.find((course) => course.id === courseDocId);
    if (!selectedCourse) {
      setLocalError("Selected course is unavailable.");
      return;
    }

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
      const created = await createMaterialDoc({
        professorId,
        courseDocId,
        courseId: selectedCourse.courseId || selectedCourse.id,
        courseName: resolveCourseName(selectedCourse),
        lectureTitle: trimmedTitle,
        lectureNumber: numericLecture,
        notes: notes.trim(),
        file,
      });

      const optimisticMaterial = {
        ...created,
        lectureTitle: trimmedTitle,
        lectureNumber: numericLecture,
        notes: notes.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (onCreated) onCreated(optimisticMaterial);
      if (onClose) onClose();
    } catch (err) {
      setLocalError(getErrorMessage(err, "Failed to add material."));
    } finally {
      setLoading(false);
    }
  }, [
    courseDocId,
    courseOptions,
    file,
    lectureNumber,
    lectureTitle,
    notes,
    onClose,
    onCreated,
    professorId,
  ]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Material</DialogTitle>
      <DialogContent className="space-y-4">
        {localError ? <Alert severity="error">{localError}</Alert> : null}

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Course
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            value={courseDocId}
            onChange={(event) => setCourseDocId(event.target.value)}
            disabled={loading || courseOptions.length === 0}
            required
          >
            <option value="" disabled>
              {coursePlaceholder}
            </option>
            {courseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {resolveCourseName(course)}
                {course?.termId ? ` - ${course.termId}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Lecture title
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            type="text"
            value={lectureTitle}
            onChange={(event) => setLectureTitle(event.target.value)}
            placeholder="Lecture 1: Introduction"
            required
            disabled={loading}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Lecture number (optional)
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            type="number"
            min="1"
            value={lectureNumber}
            onChange={(event) => setLectureNumber(event.target.value)}
            placeholder="1"
            disabled={loading}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          PDF file
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={loading}
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Notes (optional)
          <textarea
            className="min-h-[96px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Key topics, reading hints, or quick notes."
            disabled={loading}
          />
        </label>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || courseOptions.length === 0}
        >
          {loading ? "Uploading..." : "Add Material"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddMaterialModal;
