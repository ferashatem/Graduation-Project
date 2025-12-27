import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";
import EditAssignmentModal from "../../components/admin/EditAssignmentModal";
import { db } from "../../firebase/firebaseConfig";
import { getErrorMessage } from "../../utils/errorHelpers";

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

function AssignmentList() {
  const assignmentsRef = useMemo(() => collection(db, "courseAssignments"), [db]);
  const coursesRef = useMemo(() => collection(db, "courses"), [db]);
  const profsRef = useMemo(() => collection(db, "profs"), [db]);
  const assistantsRef = useMemo(() => collection(db, "assistants"), [db]);

  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeAssignment, setActiveAssignment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Load assignments + reference data once to avoid N+1 reads.
      const [assignmentSnap, coursesSnap, profsSnap, assistantsSnap] =
        await Promise.all([
          getDocs(assignmentsRef),
          getDocs(coursesRef),
          getDocs(profsRef),
          getDocs(assistantsRef),
        ]);

      setAssignments(assignmentSnap.docs.map(mapDoc));
      setCourses(coursesSnap.docs.map(mapDoc));
      setProfessors(profsSnap.docs.map(mapDoc));
      setAssistants(assistantsSnap.docs.map(mapDoc));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [assignmentsRef, assistantsRef, coursesRef, profsRef]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const courseMap = useMemo(() => {
    const map = new Map();
    courses.forEach((course) => map.set(course.id, course));
    return map;
  }, [courses]);

  const handleEdit = useCallback((assignment) => {
    setActiveAssignment(assignment);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleSaved = useCallback((updated) => {
    if (!updated?.id) return;
    setAssignments((prev) =>
      prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
    );
  }, []);

  const rows = useMemo(
    () =>
      assignments.map((assignment) => {
        const course = courseMap.get(assignment.courseId);
        const label = course
          ? `${course.code ? `${course.code} - ` : ""}${course.name}`
          : "Unknown course";
        return {
          ...assignment,
          courseLabel: label,
          termDisplay: assignment.termLabel || assignment.termId || "-",
          professorCount: assignment.professorIds?.length || 0,
          assistantCount: assignment.assistantIds?.length || 0,
        };
      }),
    [assignments, courseMap]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Course Assignments"
        action={
          <Button
            component={RouterLink}
            to="/admin/assignments/new"
            variant="contained"
          >
            Create Assignment
          </Button>
        }
      />

      {error && !loading ? <ErrorState message={error} onRetry={loadData} /> : null}
      {loading ? (
        <Loading label="Loading assignments..." />
      ) : (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Course</th>
                <th className="px-4 py-3 text-left font-semibold">Term</th>
                <th className="px-4 py-3 text-left font-semibold">Professors</th>
                <th className="px-4 py-3 text-left font-semibold">Assistants</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={5}>
                    No assignments yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium">{row.courseLabel}</td>
                    <td className="px-4 py-3">{row.termDisplay}</td>
                    <td className="px-4 py-3">{row.professorCount}</td>
                    <td className="px-4 py-3">{row.assistantCount}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleEdit(row)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <EditAssignmentModal
        open={modalOpen}
        assignment={activeAssignment}
        courseLabel={activeAssignment?.courseLabel}
        professors={professors}
        assistants={assistants}
        onClose={handleCloseModal}
        onSaved={handleSaved}
      />
    </div>
  );
}

export default AssignmentList;
