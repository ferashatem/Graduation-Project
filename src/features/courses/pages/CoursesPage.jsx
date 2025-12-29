import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Alert } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import CoursesTable from "../components/CoursesTable";
import CourseFormDialog from "../components/CourseFormDialog";
import AssignStaffDialog from "../components/AssignStaffDialog";
import { useCourses } from "../hooks/useCourses";
import { getCollegeById } from "../../colleges/api/collegesApi";
import { getYearById } from "../../years/api/yearsApi";
import { getDepartmentById } from "../../departments/api/departmentsApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

function CoursesPage() {
  const navigate = useNavigate();
  const { collegeId, yearId, deptId } = useParams();
  const {
    courses,
    loading,
    error,
    reload,
    addCourse,
    updateCourse,
    deleteCourse,
  } = useCourses(collegeId, yearId, deptId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, row: null });
  const [actionError, setActionError] = useState("");
  const [assignStaffOpen, setAssignStaffOpen] = useState(false);
  const [assignStaffCourse, setAssignStaffCourse] = useState(null);
  const [collegeName, setCollegeName] = useState("");
  const [yearName, setYearName] = useState("");
  const [departmentName, setDepartmentName] = useState("");

  const rows = useMemo(() => courses, [courses]);

  const loadBreadcrumbs = useCallback(async () => {
    if (!collegeId || !yearId || !deptId) return;
    try {
      const [college, year, department] = await Promise.all([
        getCollegeById(collegeId),
        getYearById(collegeId, yearId),
        getDepartmentById(collegeId, yearId, deptId),
      ]);
      setCollegeName(college?.name || "College");
      setYearName(year?.name || "Year");
      setDepartmentName(department?.name || "Department");
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }, [collegeId, deptId, yearId]);

  useEffect(() => {
    loadBreadcrumbs();
  }, [loadBreadcrumbs]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Colleges", to: "/admin/colleges" },
      {
        label: collegeName || "College",
        to: `/admin/colleges/${collegeId}/years`,
      },
      {
        label: yearName || "Year",
        to: `/admin/colleges/${collegeId}/years/${yearId}/departments`,
      },
      { label: departmentName || "Department" },
      { label: "Courses" },
    ],
    [collegeId, collegeName, departmentName, yearId, yearName]
  );

  const handleAdd = useCallback(() => {
    setEditing(null);
    setActionError("");
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((row) => {
    setEditing(row);
    setActionError("");
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleDeletePrompt = useCallback((row) => {
    setConfirmState({ open: true, row });
  }, []);

  const handleAssignStaff = useCallback((row) => {
    setAssignStaffCourse(row);
    setAssignStaffOpen(true);
  }, []);

  const handleCloseAssignStaff = useCallback(() => {
    setAssignStaffOpen(false);
    setAssignStaffCourse(null);
  }, []);

  const handleCloseConfirm = useCallback(() => {
    setConfirmState({ open: false, row: null });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const target = confirmState.row;
    handleCloseConfirm();
    if (!target) return;
    const result = await deleteCourse(target.id);
    if (!result.ok) {
      setActionError(result.error);
    }
  }, [confirmState.row, deleteCourse, handleCloseConfirm]);

  const handleSubmit = useCallback(
    async (values) => {
      setActionError("");
      const result = editing
        ? await updateCourse(editing.id, values)
        : await addCourse(values);

      if (result.ok) {
        setDialogOpen(false);
        setEditing(null);
      } else {
        setActionError(result.error);
      }
    },
    [addCourse, editing, updateCourse]
  );

  const handleGoBack = useCallback(() => {
    navigate(`/admin/colleges/${collegeId}/years/${yearId}/departments`);
  }, [collegeId, navigate, yearId]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Courses"
        breadcrumbs={breadcrumbs}
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button variant="outlined" onClick={handleGoBack}>
              Back to Departments
            </Button>
            <Button variant="contained" onClick={handleAdd}>
              Add Course
            </Button>
          </div>
        }
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}
      {error && !loading ? <ErrorState message={error} onRetry={reload} /> : null}
      {loading && rows.length === 0 ? (
        <Loading label="Loading courses..." />
      ) : (
        <CoursesTable
          rows={rows}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
          onAssignStaff={handleAssignStaff}
        />
      )}

      <CourseFormDialog
        open={dialogOpen}
        initialValues={editing}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        error={actionError}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete course?"
        message="This will remove the course record."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirm}
      />

      <AssignStaffDialog
        open={assignStaffOpen}
        course={assignStaffCourse}
        onClose={handleCloseAssignStaff}
      />
    </div>
  );
}

export default CoursesPage;
