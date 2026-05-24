import { useCallback, useEffect, useState } from "react";
import { Alert, Button, CircularProgress, Snackbar } from "@mui/material";
import { HiSearch, HiDatabase } from "react-icons/hi";
import Loading from "../common/Loading";
import ErrorState from "../common/ErrorState";
import ConfirmDialog from "../common/ConfirmDialog";
import { getMaterialsByOffering, getMaterialDownloadUrl, deleteMaterial } from "../../api/materialsApi";
import { indexMaterial, ragSearchByOffering } from "../../api/ragApi";
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
  const [searchQuery,      setSearchQuery]      = useState("");
  const [searchResults,    setSearchResults]    = useState(null);
  const [searching,        setSearching]        = useState(false);
  const [indexingId,       setIndexingId]       = useState(null);

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

  const handleIndex = useCallback(async (materialId) => {
    setIndexingId(materialId);
    try {
      await indexMaterial(materialId);
      setToast({ open: true, message: "Material indexed for AI search.", severity: "success" });
    } catch (err) {
      setToast({ open: true, message: getErrorMessage(err, "Indexing failed."), severity: "error" });
    } finally {
      setIndexingId(null);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !offeringId) return;
    setSearching(true); setSearchResults(null);
    try {
      const result = await ragSearchByOffering(offeringId, searchQuery);
      setSearchResults(result?.chunks ?? result ?? []);
    } catch {
      setSearchResults([]);
      setToast({ open: true, message: "Search failed. Make sure materials are indexed.", severity: "error" });
    } finally {
      setSearching(false);
    }
  }, [searchQuery, offeringId]);

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
      {/* RAG Semantic Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchResults(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Semantic search across materials…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-300"
          />
        </div>
        <button type="button" onClick={handleSearch} disabled={searching || !searchQuery.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-[#0b2c4a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#153a63] disabled:opacity-50">
          {searching ? <CircularProgress size={14} color="inherit" /> : <HiSearch className="h-4 w-4" />}
          Search
        </button>
      </div>

      {/* Search Results */}
      {searchResults !== null && (
        <div className="rounded-2xl bg-slate-50 p-4 space-y-2 ring-1 ring-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Search Results ({searchResults.length})
          </p>
          {searchResults.length === 0 ? (
            <p className="text-sm text-slate-500">No results found. Try indexing materials first.</p>
          ) : (
            searchResults.map((chunk, i) => (
              <div key={i} className="rounded-xl bg-white p-3 ring-1 ring-slate-100 space-y-1">
                <p className="text-xs font-semibold text-[#0b2c4a]">{chunk.materialTitle ?? chunk.source ?? `Chunk ${i + 1}`}</p>
                <p className="text-sm text-slate-700">{chunk.text ?? chunk.content ?? "—"}</p>
                {chunk.score != null && (
                  <p className="text-xs text-slate-400">Relevance: {Math.round(chunk.score * 100)}%</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

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
                <Button size="small" variant="outlined" color="secondary"
                  onClick={() => handleIndex(m.id)}
                  disabled={indexingId === m.id}
                  startIcon={indexingId === m.id ? <CircularProgress size={12} /> : <HiDatabase style={{ fontSize: 14 }} />}>
                  {indexingId === m.id ? "Indexing…" : "Index for AI"}
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
