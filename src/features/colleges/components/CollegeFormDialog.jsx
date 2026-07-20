import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  MenuItem,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { fetchUniversities } from "../api/collegesApi";

const emptyValues = { name: "", code: "", universityId: "" };

function CollegeFormDialog({
  open,
  initialValues,
  onClose,
  onSubmit,
  submitting,
  error,
}) {
  const [values, setValues]             = useState(emptyValues);
  const [fieldErrors, setFieldErrors]   = useState({});
  const [universities, setUniversities] = useState([]);
  const [uniLoading, setUniLoading]     = useState(false);
  const [uniError, setUniError]         = useState("");

  const isEdit    = useMemo(() => Boolean(initialValues && (initialValues.id || initialValues.code)), [initialValues]);
  const title     = useMemo(() => (isEdit ? "Edit College" : "Add College"), [isEdit]);
  const submitLabel = useMemo(() => (isEdit ? "Save Changes" : "Create College"), [isEdit]);

  useEffect(() => {
    if (!open) return;
    setUniLoading(true);
    setUniError("");
    fetchUniversities()
      .then((list) => setUniversities(list))
      .catch(() => setUniError("Failed to load universities."))
      .finally(() => setUniLoading(false));
  }, [open]);

  useEffect(() => {
    if (open) {
      setValues({
        name: initialValues?.name || "",
        code: initialValues?.code || "",
        universityId: initialValues?.universityId?.toString() || "",
      });
      setFieldErrors({});
    }
  }, [open, initialValues]);

  useEffect(() => {
    if (universities.length === 1 && !values.universityId) {
      setValues((prev) => ({ ...prev, universityId: universities[0].id?.toString() || "" }));
    }
  }, [universities, values.universityId]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const validate = useCallback(() => {
    const errs = {};
    if (!values.name.trim())       errs.name         = "College name is required.";
    if (!values.code.trim())       errs.code         = "College code is required.";
    if (!values.universityId)      errs.universityId = "Please select a university.";
    return errs;
  }, [values]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    await onSubmit({
      name:         values.name.trim(),
      code:         values.code.trim(),
      universityId: values.universityId,
    });
  }, [onSubmit, validate, values]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>

        <DialogContent className="space-y-4" sx={{ pt: "16px !important" }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            select
            label="University"
            name="universityId"
            value={values.universityId}
            onChange={handleChange}
            error={Boolean(fieldErrors.universityId) || Boolean(uniError)}
            helperText={fieldErrors.universityId || uniError}
            fullWidth
            required
            disabled={uniLoading || submitting}
            InputProps={uniLoading ? {
              startAdornment: (
                <InputAdornment position="start">
                  <CircularProgress size={16} />
                </InputAdornment>
              ),
            } : undefined}
          >
            {universities.length === 0 && !uniLoading ? (
              <MenuItem disabled value="">
                No universities found
              </MenuItem>
            ) : (
              universities.map((u) => (
                <MenuItem key={u.id} value={u.id?.toString()}>
                  <span className="flex items-center gap-2">
                    <AccountBalanceIcon fontSize="small" className="text-slate-400" />
                    {u.name}
                    {u.code && (
                      <span className="ml-auto text-xs text-slate-400 font-mono">{u.code}</span>
                    )}
                  </span>
                </MenuItem>
              ))
            )}
          </TextField>

          <TextField
            label="College Name"
            name="name"
            value={values.name}
            onChange={handleChange}
            error={Boolean(fieldErrors.name)}
            helperText={fieldErrors.name}
            fullWidth
            required
            disabled={submitting}
            placeholder="e.g. Faculty of Computer Science"
          />

          <TextField
            label="College Code"
            name="code"
            value={values.code}
            onChange={handleChange}
            error={Boolean(fieldErrors.code)}
            helperText={fieldErrors.code || "Short uppercase identifier, e.g. FCS"}
            fullWidth
            required
            disabled={submitting}
            placeholder="e.g. FCS"
            inputProps={{ style: { textTransform: "uppercase" } }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || uniLoading || universities.length === 0}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
          >
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CollegeFormDialog;
