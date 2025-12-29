import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Snackbar,
  TextField,
} from "@mui/material";
import { searchUsersByRole } from "../../users/api/usersApi";
import { upsertAssignment } from "../api/courseAssignmentsApi";
import { buildTermOptions } from "../utils/courseOfferingsUtils";
import {
  buildOfferingId,
  normalizeSection,
  normalizeTermId,
  normalizeYearLevel,
} from "../utils/courseAssignmentsUtils";
import { getErrorMessage } from "../../../utils/errorHelpers";

const TERM_OPTIONS = buildTermOptions();
const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 350;

const getUserId = (user) => user?.uid || user?.id || "";

const getUserLabel = (user) =>
  user?.name || user?.displayName || user?.fullName || user?.email || "Unnamed user";

const buildCourseLabel = (course) => {
  if (!course) return "Course";
  if (course.code) return `${course.code} - ${course.name || "Course"}`;
  return course.name || "Course";
};

const buildUserSummary = (user) => {
  if (!user) return null;
  return {
    uid: getUserId(user),
    displayName: user.name || user.displayName || user.fullName || "",
    email: user.email || "",
  };
};

function AssignStaffDialog({ open, course, onClose }) {
  const [termId, setTermId] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [section, setSection] = useState("");
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [selectedAssistants, setSelectedAssistants] = useState([]);
  const [professorSearch, setProfessorSearch] = useState("");
  const [assistantSearch, setAssistantSearch] = useState("");
  const [professorOptions, setProfessorOptions] = useState([]);
  const [assistantOptions, setAssistantOptions] = useState([]);
  const [professorLoading, setProfessorLoading] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAssignment, setSavedAssignment] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const courseLabel = useMemo(() => buildCourseLabel(course), [course]);
  const normalizedTermId = useMemo(() => normalizeTermId(termId), [termId]);
  const normalizedSection = useMemo(() => normalizeSection(section), [section]);
  const normalizedYearLevel = useMemo(
    () => normalizeYearLevel(yearLevel),
    [yearLevel]
  );
  const yearLevelNumber = useMemo(() => {
    const parsed = Number(normalizedYearLevel);
    return Number.isFinite(parsed) ? parsed : NaN;
  }, [normalizedYearLevel]);
  const professorId = useMemo(
    () => getUserId(selectedProfessor),
    [selectedProfessor]
  );
  const assistantIds = useMemo(
    () =>
      Array.from(
        new Set(
          (selectedAssistants || [])
            .map((assistant) => getUserId(assistant))
            .filter(Boolean)
        )
      ),
    [selectedAssistants]
  );

  const offeringId = useMemo(() => {
    if (!course?.id || !normalizedTermId || !normalizedSection) {
      return "";
    }
    if (!Number.isFinite(yearLevelNumber) || yearLevelNumber <= 0) {
      return "";
    }
    return buildOfferingId({
      courseId: course.id,
      termId: normalizedTermId,
      yearLevel: String(yearLevelNumber),
      section: normalizedSection,
    });
  }, [
    course,
    normalizedSection,
    normalizedTermId,
    yearLevelNumber,
  ]);

  const yearLevelInvalid =
    normalizedYearLevel &&
    (!Number.isFinite(yearLevelNumber) || yearLevelNumber <= 0);

  const canSave = useMemo(
    () =>
      Boolean(
        course?.id &&
          normalizedTermId &&
          normalizedSection &&
          professorId &&
          Number.isFinite(yearLevelNumber) &&
          yearLevelNumber > 0
      ),
    [
      course,
      normalizedSection,
      normalizedTermId,
      professorId,
      yearLevelNumber,
    ]
  );

  useEffect(() => {
    if (!open) return;
    setTermId("");
    setYearLevel(
      course?.yearLevel !== undefined && course?.yearLevel !== null
        ? String(course.yearLevel)
        : ""
    );
    setSection("");
    setSelectedProfessor(null);
    setSelectedAssistants([]);
    setProfessorSearch("");
    setAssistantSearch("");
    setProfessorOptions([]);
    setAssistantOptions([]);
    setSavedAssignment(null);
    setError("");
  }, [course, open]);

  useEffect(() => {
    if (!open) return;
    const trimmedSearch = professorSearch.trim();
    if (trimmedSearch.length < MIN_SEARCH_LENGTH) {
      setProfessorOptions([]);
      setProfessorLoading(false);
      return;
    }

    let active = true;
    const handler = setTimeout(async () => {
      setProfessorLoading(true);
      try {
        const field = trimmedSearch.includes("@") ? "email" : "name";
        const users = await searchUsersByRole({
          roles: ["professor"],
          search: trimmedSearch,
          field,
          limitCount: 8,
        });
        if (!active) return;
        const filtered = users.filter(
          (user) => getUserId(user) && getUserId(user) !== professorId
        );
        setProfessorOptions(filtered);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setProfessorLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [open, professorId, professorSearch]);

  useEffect(() => {
    if (!open) return;
    const trimmedSearch = assistantSearch.trim();
    if (trimmedSearch.length < MIN_SEARCH_LENGTH) {
      setAssistantOptions([]);
      setAssistantLoading(false);
      return;
    }

    let active = true;
    const handler = setTimeout(async () => {
      setAssistantLoading(true);
      try {
        const field = trimmedSearch.includes("@") ? "email" : "name";
        const users = await searchUsersByRole({
          roles: ["assistant"],
          search: trimmedSearch,
          field,
          limitCount: 10,
        });
        if (!active) return;
        const filtered = users.filter(
          (user) => !assistantIds.includes(getUserId(user))
        );
        setAssistantOptions(filtered);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setAssistantLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [assistantIds, assistantSearch, open]);

  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  const handleToastClose = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!course?.id) return;
    setError("");

    if (!canSave) {
      setError("Please complete all required fields.");
      return;
    }

    const payload = {
      courseId: course.id,
      termId: normalizedTermId,
      yearLevel: yearLevelNumber,
      section: normalizedSection,
      professorId,
      assistantIds,
    };

    const optimisticAssignment = {
      offeringId: buildOfferingId({
        courseId: course.id,
        termId: normalizedTermId,
        yearLevel: String(yearLevelNumber),
        section: normalizedSection,
      }),
      courseId: course.id,
      termId: normalizedTermId,
      yearLevel: yearLevelNumber,
      section: normalizedSection,
      professorId,
      assistantIds,
      professor: buildUserSummary(selectedProfessor),
      assistants: selectedAssistants
        .map(buildUserSummary)
        .filter((assistant) => assistant && assistant.uid),
    };

    const previousAssignment = savedAssignment;
    setSavedAssignment(optimisticAssignment);
    setSaving(true);

    try {
      const data = await upsertAssignment(payload);
      const assignment = data?.assignment || optimisticAssignment;
      setSavedAssignment(assignment);
      if (assignment?.professor) {
        setSelectedProfessor(assignment.professor);
      }
      if (Array.isArray(assignment?.assistants)) {
        setSelectedAssistants(assignment.assistants);
      }
      setToast({
        open: true,
        severity: "success",
        message: "Staff assigned successfully.",
      });
    } catch (err) {
      setSavedAssignment(previousAssignment);
      const message = getErrorMessage(err);
      setError(message);
      setToast({
        open: true,
        severity: "error",
        message,
      });
    } finally {
      setSaving(false);
    }
  }, [
    assistantIds,
    canSave,
    course,
    normalizedSection,
    normalizedTermId,
    professorId,
    savedAssignment,
    selectedAssistants,
    selectedProfessor,
    yearLevelNumber,
  ]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Assign Staff</DialogTitle>
      <DialogContent className="space-y-4">
        <div className="text-sm font-medium text-slate-600">{courseLabel}</div>
        {offeringId ? (
          <div className="text-xs text-slate-500">Offering ID: {offeringId}</div>
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}

        <div className="grid gap-3 md:grid-cols-3">
          <TextField
            select
            label="Term"
            value={termId}
            onChange={(event) => setTermId(event.target.value)}
            required
            fullWidth
          >
            {TERM_OPTIONS.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Year Level"
            type="number"
            value={yearLevel}
            onChange={(event) => setYearLevel(event.target.value)}
            required
            fullWidth
            error={Boolean(yearLevelInvalid)}
            helperText={yearLevelInvalid ? "Enter a valid year level." : ""}
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Section"
            value={section}
            onChange={(event) => setSection(event.target.value)}
            required
            fullWidth
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Autocomplete
            value={selectedProfessor}
            onChange={(event, value) => setSelectedProfessor(value)}
            inputValue={professorSearch}
            onInputChange={(event, value) => setProfessorSearch(value)}
            options={professorOptions}
            loading={professorLoading}
            getOptionLabel={getUserLabel}
            isOptionEqualToValue={(option, value) =>
              getUserId(option) === getUserId(value)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Professor"
                placeholder="Search by name or email"
                required
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {professorLoading ? (
                        <CircularProgress color="inherit" size={18} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={getUserId(option)}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">
                    {getUserLabel(option)}
                  </span>
                  {option.email ? (
                    <span className="text-xs text-slate-500">
                      {option.email}
                    </span>
                  ) : null}
                </div>
              </li>
            )}
          />

          <Autocomplete
            multiple
            value={selectedAssistants}
            onChange={(event, value) => setSelectedAssistants(value)}
            inputValue={assistantSearch}
            onInputChange={(event, value) => setAssistantSearch(value)}
            options={assistantOptions}
            loading={assistantLoading}
            filterSelectedOptions
            getOptionLabel={getUserLabel}
            isOptionEqualToValue={(option, value) =>
              getUserId(option) === getUserId(value)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assistants / TAs"
                placeholder="Search by name or email"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {assistantLoading ? (
                        <CircularProgress color="inherit" size={18} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={getUserId(option)}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">
                    {getUserLabel(option)}
                  </span>
                  {option.email ? (
                    <span className="text-xs text-slate-500">
                      {option.email}
                    </span>
                  ) : null}
                </div>
              </li>
            )}
          />
        </div>

        {savedAssignment ? (
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Current Assignment
            </div>
            <div className="text-sm text-slate-700">
              Professor:{" "}
              {savedAssignment.professor
                ? getUserLabel(savedAssignment.professor)
                : "Not assigned"}
            </div>
            <div className="text-sm text-slate-700">
              Assistants:{" "}
              {savedAssignment.assistants && savedAssignment.assistants.length > 0
                ? savedAssignment.assistants
                    .map((assistant) => getUserLabel(assistant))
                    .join(", ")
                : "None"}
            </div>
          </div>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!canSave || saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleToastClose} severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}

export default AssignStaffDialog;
