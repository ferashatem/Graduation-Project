import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";
import { addAssignment, updateAssignment } from "../../firebase/firestoreAssignments";
import { fetchColleges } from "../../firebase/firestoreColleges";
import { getErrorMessage } from "../../utils/errorHelpers";

const COURSES_COLLECTION = "allCourses";
const ASSIGNMENTS_COLLECTION = "courseAssignments";

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

const formatUserLabel = (user) =>
  user?.name || user?.fullName || user?.displayName || user?.email || "Unnamed";

function AssignmentFormModal({
  open,
  assignment,
  professors = [],
  assistants = [],
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(assignment?.id);

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(false);

  const [courseId, setCourseId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [termId, setTermId] = useState("");
  const [termLabel, setTermLabel] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [selectedProfessorIds, setSelectedProfessorIds] = useState([]);
  const [selectedAssistantIds, setSelectedAssistantIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [collegeError, setCollegeError] = useState("");

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === courseId),
    [courseId, courses]
  );

  const selectedCollege = useMemo(
    () => colleges.find((college) => college.id === collegeId),
    [collegeId, colleges]
  );

  const coursesEmpty = useMemo(
    () => !coursesLoading && courses.length === 0,
    [courses.length, coursesLoading]
  );

  const collegesEmpty = useMemo(
    () => !collegesLoading && colleges.length === 0,
    [colleges.length, collegesLoading]
  );

  useEffect(() => {
    if (!open) return;
    setCourseId(assignment?.courseId || "");
    setCourseName(assignment?.CourseName || assignment?.courseName || "");
    setTermId(assignment?.termId || "");
    setTermLabel(assignment?.termLabel || "");
    setCollegeId(assignment?.collegeId || "");
    setSelectedProfessorIds(assignment?.professorIds || []);
    setSelectedAssistantIds(assignment?.assistantIds || []);
    setError("");
    setCollegeError("");
  }, [assignment, open]);

  useEffect(() => {
    if (!open) return;
    let isActive = true;

    const loadCourses = async () => {
      setCoursesLoading(true);
      try {
        const coursesRef = collection(db, COURSES_COLLECTION);
        const coursesQuery = query(coursesRef, orderBy("name"));
        const snapshot = await getDocs(coursesQuery);
        const nextCourses = snapshot.docs.map(mapDoc);
        nextCourses.sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""))
        );
        if (isActive) setCourses(nextCourses);
      } catch (err) {
        if (isActive) setError(getErrorMessage(err));
      } finally {
        if (isActive) setCoursesLoading(false);
      }
    };

    loadCourses();

    return () => {
      isActive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let isActive = true;

    const loadColleges = async () => {
      setCollegesLoading(true);
      try {
        const nextColleges = await fetchColleges();
        if (isActive) setColleges(nextColleges);
      } catch (err) {
        if (isActive) setError(getErrorMessage(err));
      } finally {
        if (isActive) setCollegesLoading(false);
      }
    };

    loadColleges();

    return () => {
      isActive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !selectedCourse?.name) return;
    setCourseName((prev) => (prev === selectedCourse.name ? prev : selectedCourse.name));
  }, [open, selectedCourse]);

  const handleClose = useCallback(() => {
    if (saving) return;
    if (onClose) onClose();
  }, [onClose, saving]);

  const handleCourseChange = useCallback(
    (event) => {
      const nextCourseId = event.target.value;
      setCourseId(nextCourseId);
      const nextCourse = courses.find((course) => course.id === nextCourseId);
      setCourseName(nextCourse?.name || "");
    },
    [courses]
  );

  const handleTermIdChange = useCallback((event) => {
    setTermId(event.target.value);
  }, []);

  const handleTermLabelChange = useCallback((event) => {
    setTermLabel(event.target.value);
  }, []);

  const handleCollegeChange = useCallback((event) => {
    setCollegeId(event.target.value);
    setCollegeError("");
  }, []);

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

  const handleSave = useCallback(async () => {
    if (saving) return;
    setError("");
    setCollegeError("");

    const trimmedTermId = termId.trim();
    const trimmedTermLabel = termLabel.trim();

    let isValid = true;
    if (!courseId || !trimmedTermId) {
      setError("Course and term ID are required.");
      isValid = false;
    }
    if (!collegeId) {
      setCollegeError("College is required");
      isValid = false;
    }
    if (!isValid) return;

    const resolvedCourseName =
      selectedCourse?.name || courseName.trim() || "Untitled course";
    const resolvedCollegeName =
      selectedCollege?.name || assignment?.collegeName || "";
    const resolvedCollegeCode =
      selectedCollege?.code || assignment?.collegeCode || "";

    const payload = {
      CourseName: resolvedCourseName,
      courseId,
      termId: trimmedTermId,
      termLabel: trimmedTermLabel,
      professorIds: selectedProfessorIds,
      assistantIds: selectedAssistantIds,
      collegeId,
      collegeName: resolvedCollegeName,
      collegeCode: resolvedCollegeCode,
    };

    setSaving(true);
    try {
      if (!isEdit) {
        const assignmentsRef = collection(db, ASSIGNMENTS_COLLECTION);
        const duplicateQuery = query(
          assignmentsRef,
          where("courseId", "==", courseId),
          where("termId", "==", trimmedTermId)
        );
        const duplicateSnap = await getDocs(duplicateQuery);
        if (!duplicateSnap.empty) {
          setError("An assignment already exists for this course and term.");
          setSaving(false);
          return;
        }
      }

      let saved;
      if (isEdit) {
        saved = await updateAssignment(assignment.id, payload);
      } else {
        const uid = auth?.currentUser?.uid;
        if (uid) payload.createdBy = uid;
        saved = await addAssignment(payload);
      }
      if (onSaved) onSaved(saved);
      if (onClose) onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [
    assignment,
    collegeId,
    courseId,
    courseName,
    isEdit,
    onClose,
    onSaved,
    saving,
    selectedAssistantIds,
    selectedCollege,
    selectedCourse,
    selectedProfessorIds,
    termId,
    termLabel,
  ]);

  const collegePlaceholder = useMemo(() => {
    if (collegesLoading) return "Loading colleges...";
    if (collegesEmpty) return "No colleges found";
    return "Select a college";
  }, [collegesEmpty, collegesLoading]);

  const coursePlaceholder = useMemo(() => {
    if (coursesLoading) return "Loading courses...";
    if (coursesEmpty) return "No courses found";
    return "Select a course";
  }, [coursesEmpty, coursesLoading]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? "Edit Assignment" : "Create Assignment"}</DialogTitle>
      <DialogContent className="space-y-4">
        {error ? <Alert severity="error">{error}</Alert> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            College
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              value={collegeId}
              onChange={handleCollegeChange}
              required
              disabled={collegesLoading || saving}
            >
              <option value="" disabled>
                {collegePlaceholder}
              </option>
              {colleges.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.code
                    ? `${college.name || "Unnamed college"} (${college.code})`
                    : college.name || "Unnamed college"}
                </option>
              ))}
            </select>
            {collegeError ? (
              <span className="text-xs text-red-600">{collegeError}</span>
            ) : null}
            {collegesLoading ? (
              <span className="text-xs text-slate-500">Loading colleges...</span>
            ) : collegesEmpty ? (
              <span className="text-xs text-slate-500">No colleges found</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Course
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              value={courseId}
              onChange={handleCourseChange}
              required
              disabled={coursesLoading || saving}
            >
              <option value="" disabled>
                {coursePlaceholder}
              </option>
              {courses.map((course) => {
                const label = course.code
                  ? `${course.code} - ${course.name || "Course"}`
                  : course.name || "Course";
                return (
                  <option key={course.id} value={course.id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Term ID
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              type="text"
              value={termId}
              onChange={handleTermIdChange}
              placeholder="2025-fall"
              required
              disabled={saving}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Term Label
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              type="text"
              value={termLabel}
              onChange={handleTermLabelChange}
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
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Assignment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AssignmentFormModal;
