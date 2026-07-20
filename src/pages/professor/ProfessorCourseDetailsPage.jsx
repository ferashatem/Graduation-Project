import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress,
} from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import CourseMaterialsSection from "../../components/professor/CourseMaterialsSection";
import AIChat from "../../components/professor/course-ai/AIChat";
import { fetchOffering } from "../../features/professor/api/professorBackendApi";
import { fetchEnrollmentsByOffering } from "../../features/subjectOfferings/api/subjectOfferingsApi";
import { importGrades } from "../../api/gradesApi";
import { getErrorMessage } from "../../utils/errorHelpers";

// ── Grade Import Dialog ───────────────────────────────────────────────────────
function ImportGradesDialog({ open, offeringId, onClose }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) { setFile(null); setProgress(0); setError(""); setSuccess(false); }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!file) { setError("Please select an Excel file."); return; }
    setLoading(true);
    setError("");
    try {
      await importGrades(offeringId, file, setProgress);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to import grades."));
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, [file, offeringId]);

  return (
    <Dialog open={open} onClose={() => { if (!loading) onClose(); }} maxWidth="sm" fullWidth>
      <DialogTitle>Import Grades</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        {success ? (
          <Alert severity="success">Grades imported successfully.</Alert>
        ) : (
          <>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <p className="text-sm text-slate-600">
              Upload an Excel file (.xlsx) with columns: <strong>StudentID, Midterm, Coursework, Final</strong>
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(""); }}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            {loading && progress > 0 && (
              <div className="space-y-1">
                <LinearProgress variant="determinate" value={progress} />
                <p className="text-right text-xs text-slate-500">{progress}%</p>
              </div>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {success ? (
          <Button variant="contained" onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={loading || !file}>
              {loading ? "Uploading…" : "Import"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ── Enrolled Students Section ─────────────────────────────────────────────────
function EnrolledStudentsSection({ offeringId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!offeringId) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchEnrollmentsByOffering(offeringId);
      setStudents(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load enrolled students."));
    } finally {
      setLoading(false);
    }
  }, [offeringId]);

  useEffect(() => {
    if (open && students.length === 0) load();
  }, [open, load, students.length]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Enrolled Students</h3>
        <Button size="small" variant="outlined" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Show"} Students
        </Button>
      </div>

      {open && (
        <div className="mt-4">
          {error ? <ErrorState message={error} onRetry={load} /> : null}
          {loading ? (
            <Loading label="Loading students..." />
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-500">No students enrolled yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-700">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Student ID</th>
                    <th className="py-2 pr-4">Enrolled At</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id ?? s.studentId ?? i} className="border-b border-slate-50">
                      <td className="py-2 pr-4">{s.studentName ?? s.fullName ?? "—"}</td>
                      <td className="py-2 pr-4">{s.universityStudentId ?? s.studentCode ?? "—"}</td>
                      <td className="py-2 pr-4">
                        {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString("en-US") : "—"}
                      </td>
                      <td className="py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {s.status ?? "Enrolled"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-slate-400">{students.length} student{students.length !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function ProfessorCourseDetailsPage() {
  const { courseDocId } = useParams();
  const { user, profileLoading } = useOutletContext() || {};
  const navigate = useNavigate();
  const location = useLocation();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [importOpen, setImportOpen] = useState(false);

  const basePath = useMemo(
    () => (location.pathname.startsWith("/professor") ? "/professor" : "/prof"),
    [location.pathname]
  );

  const professorUid = user?.uid ?? user?.id ?? "";

  const loadCourse = useCallback(async () => {
    if (!courseDocId) { setError("Course ID is missing."); setLoading(false); return; }
    setLoading(true);
    setError("");
    setNotFound(false);
    try {
      const data = await fetchOffering(courseDocId);
      if (!data) { setNotFound(true); return; }
      setCourse(data);
    } catch (e) {
      if (e?.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(e?.response?.data?.message ?? e?.message ?? "Failed to load course details.");
      }
    } finally {
      setLoading(false);
    }
  }, [courseDocId]);

  useEffect(() => {
    if (profileLoading) return;
    loadCourse();
  }, [profileLoading, loadCourse, refreshKey]);

  const courseSummary = useMemo(() => {
    if (!course) return null;
    return {
      name: course.subjectName ?? course.courseName ?? course.name ?? "Untitled",
      courseId: course.id ?? course.code ?? "-",
      collegeName: course.collegeName ?? course.college ?? "-",
      departmentName: course.departmentName ?? course.department ?? "-",
      semesterName: course.semesterName ?? course.term ?? course.termName ?? "-",
      creditHours: course.creditHours ?? course.credits ?? null,
    };
  }, [course]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Courses", to: `${basePath}/courses` },
      { label: courseSummary?.name || "Course Details" },
    ],
    [basePath, courseSummary?.name]
  );

  const courseForMaterials = useMemo(
    () => course ? { id: courseDocId, courseName: courseSummary?.name, termId: courseSummary?.semesterName } : null,
    [course, courseDocId, courseSummary]
  );

  const handleRetry = useCallback(() => setRefreshKey((k) => k + 1), []);
  const handleBack = useCallback(() => navigate(`${basePath}/courses`), [basePath, navigate]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={courseSummary?.name || "Course Details"}
        breadcrumbs={breadcrumbs}
        action={<Button variant="outlined" onClick={handleBack}>Back to Courses</Button>}
      />

      {error ? <ErrorState message={error} onRetry={handleRetry} /> : null}

      {profileLoading || loading ? (
        <Loading label="Loading course..." />
      ) : error ? null : notFound || !course ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Course not found.
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-800">{courseSummary?.name}</h2>
                <p className="text-sm text-slate-500">{courseSummary?.collegeName}</p>
              </div>
              <Button
                variant="contained"
                size="small"
                onClick={() => setImportOpen(true)}
                sx={{ whiteSpace: "nowrap" }}
              >
                Import Grades
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="Course ID" value={courseSummary?.courseId} />
              <InfoRow label="Department" value={courseSummary?.departmentName} />
              <InfoRow label="Semester" value={courseSummary?.semesterName} />
              {courseSummary?.creditHours && <InfoRow label="Credit Hours" value={courseSummary.creditHours} />}
            </div>
          </div>

          <EnrolledStudentsSection offeringId={courseDocId} />

          {courseForMaterials && (
            <CourseMaterialsSection professorId={professorUid} course={courseForMaterials} />
          )}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <AIChat
              professorId={professorUid}
              courseDocId={courseDocId}
              courseName={courseSummary?.name}
            />
          </div>

          <ImportGradesDialog
            open={importOpen}
            offeringId={courseDocId}
            onClose={() => setImportOpen(false)}
          />
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="text-slate-500">{value || "-"}</span>
    </div>
  );
}

export default ProfessorCourseDetailsPage;
