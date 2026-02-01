import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Snackbar } from "@mui/material";
import Loading from "../common/Loading";
import ErrorState from "../common/ErrorState";
import ConfirmDialog from "../common/ConfirmDialog";
import AddMaterialModal from "./AddMaterialModal";
import { deleteMaterial, fetchMaterialsForCourse } from "../../firebase/materialsApi";
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

function CourseMaterialsSection({ professorId, course }) {
  const courseDocId = course?.id || "";
  const courseName = resolveCourseName(course);
  const termId = course?.termId || "-";

  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState("");
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

    if (!professorId || !courseDocId) {
      setMaterials([]);
      setMaterialsLoading(false);
      return () => {
        isActive = false;
      };
    }

    setMaterialsLoading(true);
    setMaterialsError("");

    fetchMaterialsForCourse(professorId, courseDocId)
      .then((items) => {
        if (!isActive) return;
        setMaterials(sortMaterials(items));
        setMaterialsLoading(false);
      })
      .catch((err) => {
        if (!isActive) return;
        setMaterialsError(getErrorMessage(err, "Failed to load materials."));
        setMaterialsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [courseDocId, professorId, refreshKey]);

  const materialCards = useMemo(
    () =>
      materials.map((material) => ({
        id: material.id,
        materialId: material.materialId || material.id,
        courseDocId: material.courseDocId || courseDocId,
        lectureTitle: material.lectureTitle || "Untitled lecture",
        lectureNumber: normalizeLectureNumber(material.lectureNumber),
        notes: material.notes || "",
        pdfUrl: material.pdfUrl || "",
        storagePath: material.storagePath || "",
        createdAtLabel: formatDate(material.createdAt),
        courseName: material.courseName || courseName,
        termId: material.termId || termId,
      })),
    [courseDocId, courseName, materials, termId]
  );

  const handleRetry = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
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
      if (courseDocId && material.courseDocId && material.courseDocId !== courseDocId) {
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
    [courseDocId]
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
    if (!target || !professorId) return;
    setDeleting(true);
    try {
      await deleteMaterial({
        professorId,
        courseDocId: target.courseDocId || courseDocId,
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
  }, [confirmState.material, courseDocId, handleCloseConfirm, professorId]);

  const handleToastClose = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const canManageMaterials = Boolean(professorId && courseDocId);

  return (
    <div className="space-y-4">
    

      {materialsError ? (
        <ErrorState message={materialsError} onRetry={handleRetry} />
      ) : null}

      {materialsLoading ? (
        <Loading label="Loading materials..." />
      ) : materials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No materials uploaded yet.
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
        professorId={professorId}
        courses={course ? [course] : []}
        initialCourseDocId={courseDocId}
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
        <Alert onClose={handleToastClose} severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default CourseMaterialsSection;
