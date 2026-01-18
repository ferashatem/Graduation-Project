import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Alert, Button, Snackbar } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import AddMaterialModal from "../../components/professor/AddMaterialModal";
import { useAuthUser } from "../../auth/useAuthUser";
import {
  deleteMaterial,
  fetchMaterialsForCourse,
  fetchProfessorCourses,
} from "../../firebase/materialsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const resolveCourseName = (course) =>
  course?.courseName ||
  course?.CourseName ||
  course?.courseLabel ||
  "Untitled course";

const getTimestampValue = (timestamp) => {
  if (!timestamp) return 0;
  if (typeof timestamp.toDate === "function") return timestamp.toDate().getTime();
  if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000;
  if (timestamp instanceof Date) return timestamp.getTime();
  const numeric = Number(timestamp);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const formatDate = (timestamp) => {
  if (!timestamp) return "-";
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleDateString("en-US");
  }
  if (typeof timestamp.seconds === "number") {
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US");
  }
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString("en-US");
  }
  return "-";
};

const normalizeLectureNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const sortMaterials = (items) => {
  const sorted = [...items];
  sorted.sort((a, b) => {
    const aLecture = normalizeLectureNumber(a.lectureNumber);
    const bLecture = normalizeLectureNumber(b.lectureNumber);
    if (aLecture !== null && bLecture !== null) {
      return aLecture - bLecture;
    }
    if (aLecture !== null) return -1;
    if (bLecture !== null) return 1;
    return getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt);
  });
  return sorted;
};

function ProfessorMaterialsPage() {
  const outletContext = useOutletContext() || {};
  const { user: outletUser } = outletContext;
  const { user: authUser, authLoading } = useAuthUser();
  const user = outletUser || authUser;

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");

  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState("");

  const [selectedCourseDocId, setSelectedCourseDocId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [confirmState, setConfirmState] = useState({
    open: false,
    material: null,
  });
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    let isActive = true;

    if (authLoading) return;

    if (!user?.uid) {
      setCourses([]);
      setCoursesLoading(false);
      return;
    }

    setCoursesLoading(true);
    setCoursesError("");

    fetchProfessorCourses(user.uid)
      .then((data) => {
        if (!isActive) return;
        setCourses(data);
      })
      .catch((err) => {
        if (!isActive) return;
        setCoursesError(getErrorMessage(err, "Failed to load courses."));
      })
      .finally(() => {
        if (!isActive) return;
        setCoursesLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [authLoading, user?.uid, refreshKey]);

  useEffect(() => {
    if (!selectedCourseDocId) return;
    const exists = courses.some((course) => course.id === selectedCourseDocId);
    if (!exists) {
      setSelectedCourseDocId("");
    }
  }, [courses, selectedCourseDocId]);

  useEffect(() => {
    let isActive = true;

    if (authLoading || coursesLoading) return;

    if (!user?.uid) {
      setMaterials([]);
      setMaterialsLoading(false);
      return;
    }

    if (courses.length === 0) {
      setMaterials([]);
      setMaterialsLoading(false);
      return;
    }

    setMaterialsLoading(true);
    setMaterialsError("");

    const loadMaterials = async () => {
      try {
        let items = [];
        if (selectedCourseDocId) {
          items = await fetchMaterialsForCourse(user.uid, selectedCourseDocId);
        } else {
          const results = await Promise.all(
            courses.map((course) => fetchMaterialsForCourse(user.uid, course.id))
          );
          items = results.flat();
        }

        if (!isActive) return;
        setMaterials(sortMaterials(items));
        setMaterialsLoading(false);
      } catch (err) {
        if (!isActive) return;
        setMaterialsError(getErrorMessage(err, "Failed to load materials."));
        setMaterialsLoading(false);
      }
    };

    loadMaterials();

    return () => {
      isActive = false;
    };
  }, [
    authLoading,
    courses,
    coursesLoading,
    refreshKey,
    selectedCourseDocId,
    user?.uid,
  ]);

  const coursesById = useMemo(
    () => new Map(courses.map((course) => [course.id, course])),
    [courses]
  );

  const courseOptions = useMemo(
    () =>
      courses.map((course) => ({
        id: course.id,
        label: `${resolveCourseName(course)}${
          course?.termId ? ` - ${course.termId}` : ""
        }`,
      })),
    [courses]
  );

  const materialCards = useMemo(
    () =>
      materials.map((material) => {
        const course = coursesById.get(material.courseDocId);
        return {
          id: material.id,
          materialId: material.materialId || material.id,
          courseDocId: material.courseDocId,
          lectureTitle: material.lectureTitle || "Untitled lecture",
          lectureNumber: normalizeLectureNumber(material.lectureNumber),
          notes: material.notes || "",
          pdfUrl: material.pdfUrl || "",
          storagePath: material.storagePath || "",
          createdAtLabel: formatDate(material.createdAt),
          courseName: material.courseName || resolveCourseName(course),
          termId: material.termId || course?.termId || "-",
        };
      }),
    [coursesById, materials]
  );

  const handleRetry = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleCourseFilterChange = useCallback((event) => {
    setSelectedCourseDocId(event.target.value);
  }, []);

  const handleOpenModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleMaterialCreated = useCallback(
    (material) => {
      if (!material) return;
      if (selectedCourseDocId && material.courseDocId !== selectedCourseDocId) {
        return;
      }
      setMaterials((prev) => {
        const next = [material, ...prev.filter((item) => item.id !== material.id)];
        return sortMaterials(next);
      });
      setToast({
        open: true,
        message: "Material added successfully.",
        severity: "success",
      });
    },
    [selectedCourseDocId]
  );

  const handleViewPdf = useCallback((url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const handleDeletePrompt = useCallback((material) => {
    setConfirmState({ open: true, material });
  }, []);

  const handleCloseConfirm = useCallback(() => {
    setConfirmState({ open: false, material: null });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const target = confirmState.material;
    if (!target || !user?.uid) return;
    setDeleting(true);
    try {
      await deleteMaterial({
        professorId: user.uid,
        courseDocId: target.courseDocId,
        materialId: target.materialId || target.id,
        storagePath: target.storagePath,
      });
      setMaterials((prev) => prev.filter((item) => item.id !== target.id));
      setToast({
        open: true,
        message: "Material deleted.",
        severity: "success",
      });
      handleCloseConfirm();
    } catch (err) {
      setToast({
        open: true,
        message: getErrorMessage(err, "Failed to delete material."),
        severity: "error",
      });
    } finally {
      setDeleting(false);
    }
  }, [confirmState.material, handleCloseConfirm, user?.uid]);

  const handleToastClose = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  if (authLoading || coursesLoading) {
    return <Loading label="Loading materials..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Materials"
        action={
          <Button variant="contained" onClick={handleOpenModal}>
            Add Material
          </Button>
        }
      />

      {coursesError ? <ErrorState message={coursesError} onRetry={handleRetry} /> : null}

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Course materials
            </h2>
            <p className="text-sm text-slate-500">
              Upload lecture PDFs and notes for your classes.
            </p>
          </div>
          <div className="w-full sm:w-72">
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm"
              value={selectedCourseDocId}
              onChange={handleCourseFilterChange}
              disabled={courses.length === 0}
            >
              <option value="">All courses</option>
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {materialsError ? (
        <ErrorState message={materialsError} onRetry={handleRetry} />
      ) : null}

      {materialsLoading ? (
        <Loading label="Loading materials..." />
      ) : materials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {courses.length === 0
            ? "No courses assigned yet."
            : "No materials uploaded yet."}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {materialCards.map((material) => (
            <article
              key={material.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    {material.lectureTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {material.courseName} - Term {material.termId}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {material.createdAtLabel}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {material.lectureNumber !== null ? (
                  <span className="rounded-lg bg-slate-100 px-2 py-1">
                    Lecture {material.lectureNumber}
                  </span>
                ) : null}
                <span className="rounded-lg bg-slate-100 px-2 py-1">
                  PDF attached
                </span>
              </div>

              {material.notes ? (
                <p className="mt-3 text-sm text-slate-600">{material.notes}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleViewPdf(material.pdfUrl)}
                  disabled={!material.pdfUrl}
                >
                  View PDF
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDeletePrompt(material)}
                >
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AddMaterialModal
        open={modalOpen}
        professorId={user?.uid}
        courses={courses}
        initialCourseDocId={selectedCourseDocId}
        onClose={handleCloseModal}
        onCreated={handleMaterialCreated}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete material?"
        message="This will remove the PDF and its metadata."
        confirmLabel="Delete"
        loading={deleting}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
      />

      <Snackbar
        open={toast.open}
        onClose={handleToastClose}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleToastClose}
          severity={toast.severity}
          variant="filled"
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default ProfessorMaterialsPage;
