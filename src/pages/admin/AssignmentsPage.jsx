import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";
import AssignmentFormModal from "../../components/admin/AssignmentFormModal";
import ConfirmDeleteDialog from "../../components/admin/ConfirmDeleteDialog";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  deleteAssignment,
  fetchAssignments,
} from "../../firebase/firestoreAssignments";
import { getErrorMessage } from "../../utils/errorHelpers";

const USERS_COLLECTION = "users";
const EDITOR_ROLES = new Set(["admin", "professor"]);

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

const formatCreatedAt = (timestamp) => {
  if (!timestamp) return "-";
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleDateString("en-US");
  }
  if (typeof timestamp.seconds === "number") {
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US");
  }
  return "-";
};

const formatUserLabel = (user) =>
  user?.name || user?.fullName || user?.displayName || user?.email || "Unnamed";

const resolveCourseName = (assignment) =>
  assignment?.CourseName ||
  assignment?.courseName ||
  assignment?.courseLabel ||
  "Untitled course";

function AssignmentsPage() {
  const usersRef = useMemo(() => collection(db, USERS_COLLECTION), []);

  const [assignments, setAssignments] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentUser, setCurrentUser] = useState({ role: "" });
  const [roleLoading, setRoleLoading] = useState(true);

  const [activeAssignment, setActiveAssignment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Load assignments and staff options together to keep the UI in sync.
      const [nextAssignments, profsSnap, assistantsSnap] = await Promise.all([
        fetchAssignments(),
        getDocs(query(usersRef, where("role", "==", "professor"))),
        getDocs(query(usersRef, where("role", "==", "assistant"))),
      ]);

      const nextProfessors = profsSnap.docs.map(mapDoc);
      const nextAssistants = assistantsSnap.docs.map(mapDoc);

      nextProfessors.sort((a, b) =>
        formatUserLabel(a).localeCompare(formatUserLabel(b))
      );
      nextAssistants.sort((a, b) =>
        formatUserLabel(a).localeCompare(formatUserLabel(b))
      );

      setAssignments(nextAssignments);
      setProfessors(nextProfessors);
      setAssistants(nextAssistants);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [usersRef]);

  const refreshAssignments = useCallback(async () => {
    setError("");
    try {
      const nextAssignments = await fetchAssignments();
      setAssignments(nextAssignments);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let isActive = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isActive) return;
      if (!user) {
        setCurrentUser({ role: "" });
        setRoleLoading(false);
        return;
      }

      setRoleLoading(true);
      try {
        const tokenResult = await user.getIdTokenResult(true);
        const role = tokenResult?.claims?.role || "";
        setCurrentUser({ role: String(role).toLowerCase() });
      } catch (err) {
        setCurrentUser({ role: "" });
      } finally {
        if (isActive) setRoleLoading(false);
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const canManageAssignments = useMemo(
    () => EDITOR_ROLES.has(currentUser.role),
    [currentUser.role]
  );

  const rows = useMemo(
    () =>
      assignments.map((assignment) => ({
        ...assignment,
        courseName: resolveCourseName(assignment),
        termDisplay: assignment.termLabel || assignment.termId || "-",
        createdAtLabel: formatCreatedAt(assignment.createdAt),
        professorCount: assignment.professorIds?.length || 0,
        assistantCount: assignment.assistantIds?.length || 0,
      })),
    [assignments]
  );

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) => {
      const searchableValues = [
        row.courseName,
        row.termLabel,
        row.termId,
        row.termDisplay,
        row.courseId,
      ];

      return searchableValues.some((value) =>
        String(value || "").toLowerCase().includes(query)
      );
    });
  }, [rows, searchTerm]);

  const emptyMessage = useMemo(() => {
    if (searchTerm.trim()) return "No assignments match your search.";
    return "No assignments yet.";
  }, [searchTerm]);

  const handleCreate = useCallback(() => {
    setActiveAssignment(null);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((assignment) => {
    setActiveAssignment(assignment);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setActiveAssignment(null);
  }, []);

  const handleSaved = useCallback(() => {
    refreshAssignments();
  }, [refreshAssignments]);

  const handleDeleteClick = useCallback((assignment) => {
    setAssignmentToDelete(assignment);
    setDeleteDialogOpen(true);
    setDeleteError("");
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setAssignmentToDelete(null);
    setDeleteError("");
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!assignmentToDelete?.id) return;
    setDeletingId(assignmentToDelete.id);
    setDeleteError("");

    try {
      await deleteAssignment(assignmentToDelete.id);
      setAssignments((prev) =>
        prev.filter((assignment) => assignment.id !== assignmentToDelete.id)
      );
      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeletingId("");
    }
  }, [assignmentToDelete]);

  const actionLabel = useMemo(() => {
    if (roleLoading) return "Checking access...";
    return canManageAssignments ? "Actions" : "View only";
  }, [canManageAssignments, roleLoading]);

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Course Assignments"
        action={
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!canManageAssignments || roleLoading}
          >
            Create Assignment
          </Button>
        }
      />

      {error && !loading ? <ErrorState message={error} onRetry={loadData} /> : null}

      {deleteError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </div>
      ) : null}

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Search courses
          <input
            type="search"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by course name, term, or course id"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </div>

      {loading ? (
        <Loading label="Loading assignments..." />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Course</th>
                <th className="px-4 py-3 text-left font-semibold">Term</th>
                <th className="px-4 py-3 text-left font-semibold">Created At</th>
                <th className="px-4 py-3 text-left font-semibold">Professors</th>
                <th className="px-4 py-3 text-left font-semibold">Assistants</th>
                <th className="px-4 py-3 text-right font-semibold">{actionLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-slate-500"
                    colSpan={6}
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium">{row.courseName}</td>
                    <td className="px-4 py-3">{row.termDisplay}</td>
                    <td className="px-4 py-3">{row.createdAtLabel}</td>
                    <td className="px-4 py-3">{row.professorCount}</td>
                    <td className="px-4 py-3">{row.assistantCount}</td>
                    <td className="px-4 py-3 text-right">
                      {canManageAssignments ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleEdit(row)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            onClick={() => handleDeleteClick(row)}
                            disabled={deletingId === row.id}
                          >
                            {deletingId === row.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {roleLoading ? "Checking access..." : "View only"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <AssignmentFormModal
        open={modalOpen}
        assignment={activeAssignment}
        professors={professors}
        assistants={assistants}
        onClose={handleCloseModal}
        onSaved={handleSaved}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        loading={deletingId === assignmentToDelete?.id}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default AssignmentsPage;
