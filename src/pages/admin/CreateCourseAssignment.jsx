import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { Alert, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import { auth, db } from "../../firebase/firebaseConfig";
import { getErrorMessage } from "../../utils/errorHelpers";

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

function CreateCourseAssignment() {
  // Keep collection refs stable for hook dependencies and caching.
  const coursesRef = useMemo(() => collection(db, "allCourses"), [db]);
  const profsRef = useMemo(() => collection(db, "profs"), [db]);
  const assistantsRef = useMemo(() => collection(db, "assistants"), [db]);
  const assignmentsRef = useMemo(() => collection(db, "courseAssignments"), [db]);

  const [courses, setCourses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [courseId, setCourseId] = useState("");
  const [termId, setTermId] = useState("");
  const [termLabel, setTermLabel] = useState("");
  const [selectedProfessorIds, setSelectedProfessorIds] = useState([]);
  const [selectedAssistantIds, setSelectedAssistantIds] = useState([]);

  const loadOptions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Load static data once to avoid N+1 reads on render.
      const [coursesSnap, profsSnap, assistantsSnap] = await Promise.all([
        getDocs(coursesRef),
        getDocs(profsRef),
        getDocs(assistantsRef),
      ]);

      const nextCourses = coursesSnap.docs.map(mapDoc);
      const nextProfs = profsSnap.docs.map(mapDoc);
      const nextAssistants = assistantsSnap.docs.map(mapDoc);

      nextCourses.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      nextProfs.sort((a, b) =>
        (a.displayName || "").localeCompare(b.displayName || "")
      );
      nextAssistants.sort((a, b) =>
        (a.displayName || "").localeCompare(b.displayName || "")
      );

      setCourses(nextCourses);
      setProfessors(nextProfs);
      setAssistants(nextAssistants);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [assistantsRef, coursesRef, profsRef]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const handleCourseChange = useCallback((event) => {
    setCourseId(event.target.value);
  }, []);

  const handleTermIdChange = useCallback((event) => {
    setTermId(event.target.value);
  }, []);

  const handleTermLabelChange = useCallback((event) => {
    setTermLabel(event.target.value);
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

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setError("");
      setSuccess("");

      const trimmedTermId = termId.trim();
      if (!courseId || !trimmedTermId) {
        setError("Course and term ID are required.");
        return;
      }

      setSubmitting(true);
      try {
        // Guard against duplicate assignments for the same course + term.
        const duplicateQuery = query(
          assignmentsRef,
          where("courseId", "==", courseId),
          where("termId", "==", trimmedTermId)
        );
        const duplicateSnap = await getDocs(duplicateQuery);
        if (!duplicateSnap.empty) {
          setError("An assignment already exists for this course and term.");
          return;
        }

        const payload = {
          courseId,
          termId: trimmedTermId,
          termLabel: termLabel.trim(),
          professorIds: selectedProfessorIds,
          assistantIds: selectedAssistantIds,
          createdAt: serverTimestamp(),
        };

        const uid = auth?.currentUser?.uid;
        if (uid) {
          payload.createdBy = uid;
        }

        await addDoc(assignmentsRef, payload);

        setSuccess("Assignment created successfully.");
        setCourseId("");
        setTermId("");
        setTermLabel("");
        setSelectedProfessorIds([]);
        setSelectedAssistantIds([]);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setSubmitting(false);
      }
    },
    [
      assignmentsRef,
      auth,
      courseId,
      selectedAssistantIds,
      selectedProfessorIds,
      termId,
      termLabel,
    ]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Create Course Assignment"
        action={
          <Button
            component={RouterLink}
            to="/admin/assignments"
            variant="outlined"
          >
            Back to Assignments
          </Button>
        }
      />

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {loading ? (
        <Loading label="Loading courses, professors, and assistants..." />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Course
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
                value={courseId}
                onChange={handleCourseChange}
                required
              >
                <option value="">Select a course</option>
                {courses.map((course) => {
                  const label = course.code
                    ? `${course.code} - ${course.name}`
                    : course.name;
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
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              Term Label
              <input
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
                type="text"
                value={termLabel}
                onChange={handleTermLabelChange}
                placeholder="Fall 2025"
              />
            </label>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="text-sm font-semibold text-slate-700">
                Professors
              </div>
              {professors.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  No professors found.
                </p>
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
                          {prof.name || "Unnamed professor"}
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
              <div className="text-sm font-semibold text-slate-700">
                Assistants
              </div>
              {assistants.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  No assistants found.
                </p>
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
                          {assistant.name || "Unnamed assistant"}
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

          <div className="flex justify-end">
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Creating..." : "Create Assignment"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CreateCourseAssignment;
