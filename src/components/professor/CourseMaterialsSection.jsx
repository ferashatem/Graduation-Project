import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Snackbar } from "@mui/material";
import Loading from "../common/Loading";
import ErrorState from "../common/ErrorState";
import ConfirmDialog from "../common/ConfirmDialog";
import { getMaterialsByOffering, getMaterialDownloadUrl, deleteMaterial } from "../../api/materialsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

function CourseMaterialsSection({ course }) {
  // course.id should be the subjectOfferingId when coming from my-offerings
  const offeringId = course?.id || "";

  const [materials,       setMaterials]       = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError,   setMaterialsError]   = useState("");
  const [refreshKey,       setRefreshKey]       = useState(0);
  const [confirmState,     setConfirmState]     = useState({ open: false, material: null });
  const [deleting,         setDeleting]         = useState(false);
  const [toast,            setToast]            = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (!offeringId) {
      setMaterials([]);
      setMaterialsLoading(false);
      return;
    }
    let active = true;
    setMaterialsLoading(true);
    setMaterialsError("");
    getMaterialsByOffering(offeringId)
      .then((items) => { if (active) setMaterials(items); })
      .catch((err)  => { if (active) setMaterialsError(getErrorMessage(err, "Failed to load materials.")); })
      .finally(()   => { if (active) setMaterialsLoading(false); });
    return () => { active = false; };
  }, [offeringId, refreshKey]);

  const handleViewPdf = useCallback(async (materialId) => {
    try {
      const { url } = await getMaterialDownloadUrl(materialId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setToast({ open: true, message: "Could not get download link.", severity: "error" });
    }
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const target = confirmState.material;
    if (!target) return;
    setDeleting(true);
    try {
      await deleteMaterial(target.id);
      setMaterials((prev) => prev.filter((m) => m.id !== target.id));
      setToast({ open: true, message: "Material deleted.", severity: "success" });
      setConfirmState({ open: false, material: null });
    } catch (err) {
      setToast({ open: true, message: getErrorMessage(err, "Failed to delete material."), severity: "error" });
    } finally {
      setDeleting(false);
    }
  }, [confirmState.material]);

  if (!offeringId) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
        No offering linked — materials unavailable.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {materialsError ? (
        <ErrorState message={materialsError} onRetry={() => setRefreshKey((k) => k + 1)} />
      ) : null}

      {materialsLoading ? (
        <Loading label="Loading materials..." />
      ) : materials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No materials uploaded yet.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {materials.map((m) => (
            <article key={m.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-slate-800">{m.title ?? m.fileName ?? "Material"}</h3>
                {m.description && <p className="text-xs text-slate-500">{m.description}</p>}
                <p className="text-xs text-slate-400">
                  {m.uploadedAt ? new Date(m.uploadedAt).toLocaleDateString("en-US") : ""}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="small" variant="outlined" onClick={() => handleViewPdf(m.id)}>
                  Download
                </Button>
                <Button size="small" color="error" onClick={() => setConfirmState({ open: true, material: m })}>
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmState.open}
        title="Delete material?"
        message="This will permanently remove the material."
        confirmLabel="Delete"
        loading={deleting}
        onClose={() => setConfirmState({ open: false, material: null })}
        onConfirm={handleConfirmDelete}
      />

      <Snackbar
        open={toast.open}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setToast((p) => ({ ...p, open: false }))} severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default CourseMaterialsSection;
