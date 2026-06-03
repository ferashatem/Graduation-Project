import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Alert, Button } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import { auth, db } from "../../firebase/firebaseConfig";
import { addAssignment } from "../../firebase/firestoreAssignments";
import { fetchColleges } from "../../firebase/firestoreColleges";
import { getErrorMessage } from "../../utils/errorHelpers";

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

function CreateCourseAssignment() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || "");
    });
    return () => unsub();
  }, []);

  // Keep collection refs stable for hook dependencies and caching.
  const coursesRef = useMemo(() => collection(db, "allCourses"), []);
  const usersRef = useMemo(() => collection(db, "users"), []);

  const assignmentsRef = useMemo(
    () => collection(db, "courseAssignments"),
    []
  );

  const [courses, setCourses] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [courseId, setCourseId] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [termId, setTermId] = useState("");
  const [termLabel, setTermLabel] = useState("");
  const [selectedProfessorIds, setSelectedProfessorIds] = useState([]);
  const [selectedAssistantIds, setSelectedAssistantIds] = useState([]);
  const [collegeError, setCollegeError] = useState("");

  const loadOptions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Wait for auth to resolve
      if (!userId) {
        setCourses([]);
        setColleges([]);
        setProfessors([]);
        setAssistants([]);
        return;
      }

      const [coursesSnap, profsSnap, assistantsSnap, collegesList] =
        await Promise.all([
          getDocs(coursesRef),
          getDocs(query(usersRef, where("role", "==", "professor"))),
          getDocs(query(usersRef, where("role", "==", "assistant"))),
          fetchColleges(),
        ]);

      const nextCourses = coursesSnap.docs.map(mapDoc);
      const nextProfs = profsSnap.docs.map(mapDoc);
      const nextAssistants = assistantsSnap.docs.map(mapDoc);
      const nextColleges = Array.isArray(collegesList) ? collegesList : [];

      nextCourses.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      nextProfs.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      nextAssistants.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      setCourses(nextCourses);
      setColleges(nextColleges);
      setProfessors(nextProfs);
      setAssistants(nextAssistants);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [coursesRef, userId, usersRef]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const handleCourseChange = useCallback((event) => {
    setCourseId(event.target.value);
  }, []);

  const handleCollegeChange = useCallback((event) => {
    setCollegeId(event.target.value);
    setCollegeError("");
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
      setCollegeError("");

      const trimmedTermId = termId.trim();
      if (!courseId || !trimmedTermId) {
        setError("Course and term ID are required.");
        return;
      }

      if (!collegeId) {
        setCollegeError("College is required");
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

        const selectedCourse = courses.find((course) => course.id === courseId);
        const selectedCollege = colleges.find(
          (college) => college.id === collegeId
        );

        const payload = {
          CourseName: selectedCourse?.name || "Untitled course",
          courseId,
          termId: trimmedTermId,
          termLabel: termLabel.trim(),
          professorIds: selectedProfessorIds,
          assistantIds: selectedAssistantIds,
          collegeId,
          collegeName: selectedCollege?.name || "",
          collegeCode: selectedCollege?.code || "",
        };

        const uid = auth?.currentUser?.uid;
        if (uid) payload.createdBy = uid;

        await addAssignment(payload);

        navigate("/admin/assignments");
        setSuccess("Assignment created successfully.");
        setCourseId("");
        setCollegeId("");
        setCollegeError("");
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
      collegeId,
      colleges,
      courseId,
      courses,
      selectedAssistantIds,
      selectedProfessorIds,
      termId,
      termLabel,
      navigate,
    ]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Create Course Assignment"
        action={
          <Button component={RouterLink} to="/admin/assignments" variant="outlined">
            Back to Assignments
          </Button>
        }
      />

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {loading ? (
        <Loading label="Loading courses, colleges, professors, and assistants..." />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              College
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
                value={collegeId}
                onChange={handleCollegeChange}
                required
              >
                <option value="" disabled>
                  {colleges.length === 0 ? "No colleges found" : "Select a college"}
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
            </label>

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
                          {prof.name || prof.fullName || "Unnamed professor"}
                        </span>
                        {prof.email ? (
                          <span className="block text-xs text-slate-500">{prof.email}</span>
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
                          {assistant.name || assistant.fullName || "Unnamed assistant"}
                        </span>
                        {assistant.email ? (
                          <span className="block text-xs text-slate-500">{assistant.email}</span>
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
