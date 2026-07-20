import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress } from "@mui/material";
import { uploadMaterial } from "../../api/materialsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

function AddMaterialModal({ open, course, onClose, onCreated }) {
  const offeringId = course?.id || "";

  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [file,     setFile]     = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(""); setDesc(""); setFile(null); setProgress(0); setError("");
  }, [open]);

  const handleFileChange = useCallback((e) => {
    setError("");
    const f = e.target.files?.[0] || null;
    setFile(f);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!offeringId) { setError("No offering linked to this course."); return; }
    if (!title.trim()) { setError("Title is required."); return; }
    if (!file)         { setError("File is required."); return; }

    setLoading(true);
    setError("");
    try {
      const created = await uploadMaterial(offeringId, file, setProgress, { title: title.trim(), description: desc.trim() || undefined });
      if (onCreated) onCreated(created);
      if (onClose)   onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upload material."));
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, [offeringId, title, desc, file, onCreated, onClose]);

  return (
    <Dialog open={open} onClose={() => { if (!loading) onClose?.(); }} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Material</DialogTitle>
      <DialogContent className="space-y-4">
        {error ? <Alert severity="error">{error}</Alert> : null}

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Title *
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Lecture 1: Introduction"
            disabled={loading}
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Description (optional)
          <textarea
            className="min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Brief description…"
            disabled={loading}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          File *
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            type="file"
            onChange={handleFileChange}
            disabled={loading}
            required
          />
        </label>

        {loading && progress > 0 && (
          <div className="space-y-1">
            <LinearProgress variant="determinate" value={progress} />
            <p className="text-xs text-slate-500 text-right">{progress}%</p>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose?.()} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || !offeringId}>
          {loading ? "Uploading…" : "Upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddMaterialModal;
