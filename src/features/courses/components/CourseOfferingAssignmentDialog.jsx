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
  IconButton,
  MenuItem,
  Snackbar,
  TextField,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useCourseOfferings } from "../hooks/useCourseOfferings";
import {
  fetchUsersByIds,
  searchUsersByRole,
} from "../../users/api/usersApi";
import {
  buildTermOptions,
  normalizeSectionCode,
} from "../utils/courseOfferingsUtils";
import { getErrorMessage } from "../../../utils/errorHelpers";

const TERM_OPTIONS = buildTermOptions();
const ASSISTANT_ROLES = ["assistant", "ta"];

const getUserDisplayName = (user) =>
  user?.name || user?.fullName || user?.displayName || user?.email || "Unnamed user";

const buildCourseLabel = (course) => {
  if (!course) return "Course";
  if (course.code) return `${course.code} - ${course.name || "Course"}`;
  return course.name || "Course";
};

function CourseOfferingAssignmentDialog({
  open,
  mode,
  course,
  departmentId,
  onClose,
}) {
  const {
    listLoading,
    actionLoading,
    error,
    clearError,
    loadOfferings,
    createOffering,
    assignInstructor,
    unassignInstructor,
  } = useCourseOfferings();

  const [termId, setTermId] = useState("");
  const [termName, setTermName] = useState("");
  const [sectionCode, setSectionCode] = useState("");
  const [capacity, setCapacity] = useState("");
  const [activeOffering, setActiveOffering] = useState(null);
  const [missingOffering, setMissingOffering] = useState(false);
  const [assignedProfessor, setAssignedProfessor] = useState(null);
  const [assignedAssistants, setAssignedAssistants] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userOptions, setUserOptions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [toast, setToast] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const isProfessorMode = mode === "professor";
  const courseLabel = useMemo(() => buildCourseLabel(course), [course]);
  const assignedIds = useMemo(() => {
    const ids = new Set();
    if (activeOffering?.professorId) ids.add(activeOffering.professorId);
    (activeOffering?.assistantIds || []).forEach((id) => {
      if (id) ids.add(id);
    });
    if (assignedProfessor?.id) ids.add(assignedProfessor.id);
    assignedAssistants.forEach((assistant) => {
      if (assistant?.id) ids.add(assistant.id);
    });
    return ids;
  }, [activeOffering, assignedAssistants, assignedProfessor]);

  useEffect(() => {
    if (!open) return;
    setTermId("");
    setTermName("");
    setSectionCode("");
    setCapacity("");
    setActiveOffering(null);
    setMissingOffering(false);
    setAssignedProfessor(null);
    setAssignedAssistants([]);
    setUserSearch("");
    setUserOptions([]);
    setSelectedUser(null);
    setActionError("");
    clearError();
  }, [clearError, open]);

  useEffect(() => {
    if (!open) return;
    setActiveOffering(null);
    setMissingOffering(false);
    setAssignedProfessor(null);
    setAssignedAssistants([]);
  }, [open, sectionCode, termId]);

  const handleToastClose = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  const handleTermChange = useCallback((event) => {
    const nextTermId = event.target.value;
    const option = TERM_OPTIONS.find((item) => item.id === nextTermId);
    setTermId(nextTermId);
    setTermName(option?.label || "");
  }, []);

  const handleSectionChange = useCallback((event) => {
    setSectionCode(event.target.value);
  }, []);

  const handleCapacityChange = useCallback((event) => {
    setCapacity(event.target.value);
  }, []);

  const hydrateAssignments = useCallback(async (offering) => {
    const ids = [];
    if (offering?.professorId) ids.push(offering.professorId);
    if (Array.isArray(offering?.assistantIds)) {
      ids.push(...offering.assistantIds);
    }

    const users = await fetchUsersByIds(ids);
    const userMap = new Map(users.map((user) => [user.id, user]));

    setAssignedProfessor(
      offering?.professorId
        ? userMap.get(offering.professorId) || {
            id: offering.professorId,
            fullName: "Unknown user",
          }
        : null
    );
    setAssignedAssistants(
      (offering?.assistantIds || [])
        .map(
          (id) =>
            userMap.get(id) || {
              id,
              fullName: "Unknown user",
            }
        )
        .filter(Boolean)
    );
  }, []);

  const handleLoadOffering = useCallback(async () => {
    if (!course?.id) return;
    setActionError("");
    clearError();

    const normalizedSection = normalizeSectionCode(sectionCode);
    if (!termId || !normalizedSection) {
      setActionError("Term and section are required.");
      return;
    }

    const result = await loadOfferings({ courseId: course.id, termId });
    if (!result.ok) {
      setActionError(result.error);
      setToast({
        open: true,
        severity: "error",
        message: result.error,
      });
      return;
    }

    const offerings = result.data?.offerings || [];
    const match = offerings.find(
      (offering) =>
        normalizeSectionCode(offering.sectionCode) === normalizedSection
    );

    if (!match) {
      setActiveOffering(null);
      setCapacity("");
      setMissingOffering(true);
      setAssignedProfessor(null);
      setAssignedAssistants([]);
      return;
    }

    setActiveOffering(match);
    setCapacity(
      typeof match.capacity === "number" ? String(match.capacity) : ""
    );
    setMissingOffering(false);
    await hydrateAssignments(match);
  }, [clearError, course, hydrateAssignments, loadOfferings, sectionCode, termId]);

  const handleCreateOffering = useCallback(async () => {
    if (!course?.id || !departmentId) return;
    setActionError("");
    clearError();

    const normalizedSection = normalizeSectionCode(sectionCode);
    if (!termId || !termName || !normalizedSection) {
      setActionError("Term and section are required.");
      return;
    }

    const result = await createOffering({
      courseId: course.id,
      departmentId,
      termId,
      termName,
      sectionCode: normalizedSection,
      capacity,
    });

    if (!result.ok) {
      setActionError(result.error);
      setToast({
        open: true,
        severity: "error",
        message: result.error,
      });
      return;
    }

    const offering = result.data?.offering;
    setActiveOffering(offering || null);
    setMissingOffering(false);
    setAssignedProfessor(null);
    setAssignedAssistants([]);
    setToast({
      open: true,
      severity: "success",
      message: "Offering created successfully.",
    });
  }, [
    capacity,
    clearError,
    course,
    createOffering,
    departmentId,
    sectionCode,
    termId,
    termName,
  ]);

  useEffect(() => {
    if (!open || !activeOffering) return;
    const trimmedSearch = userSearch.trim();
    if (trimmedSearch.length < 2) {
      setUserOptions([]);
      return;
    }

    const handler = setTimeout(async () => {
      setUserLoading(true);
      try {
        const roles = isProfessorMode ? ["professor"] : ASSISTANT_ROLES;
        const field = trimmedSearch.includes("@") ? "email" : "name";
        const users = await searchUsersByRole({
          roles,
          search: trimmedSearch,
          field,
          limitCount: 8,
        });
        const filtered = users.filter((user) => !assignedIds.has(user.id));
        setUserOptions(filtered);
      } catch (err) {
        setActionError(getErrorMessage(err));
      } finally {
        setUserLoading(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [activeOffering, assignedIds, isProfessorMode, open, userSearch]);

  const handleAssign = useCallback(async () => {
    if (!activeOffering || !selectedUser) return;
    setActionError("");
    clearError();

    if (isProfessorMode && activeOffering.professorId) {
      setActionError("A professor is already assigned to this offering.");
      return;
    }

    const previousOffering = activeOffering;
    const previousProfessor = assignedProfessor;
    const previousAssistants = assignedAssistants;

    if (isProfessorMode) {
      setActiveOffering((prev) =>
        prev ? { ...prev, professorId: selectedUser.id } : prev
      );
      setAssignedProfessor(selectedUser);
    } else {
      setActiveOffering((prev) =>
        prev
          ? {
              ...prev,
              assistantIds: Array.from(
                new Set([...(prev.assistantIds || []), selectedUser.id])
              ),
            }
          : prev
      );
      setAssignedAssistants((prev) => {
        if (prev.some((assistant) => assistant.id === selectedUser.id)) {
          return prev;
        }
        return [...prev, selectedUser];
      });
    }

    setSelectedUser(null);
    setUserSearch("");

    const result = await assignInstructor({
      offeringId: activeOffering.id,
      userId: selectedUser.id,
      role: isProfessorMode ? "professor" : "assistant",
    });

    if (!result.ok) {
      setActiveOffering(previousOffering);
      setAssignedProfessor(previousProfessor);
      setAssignedAssistants(previousAssistants);
      setActionError(result.error);
      setToast({
        open: true,
        severity: "error",
        message: result.error,
      });
      return;
    }

    if (result.data?.offering) {
      setActiveOffering(result.data.offering);
    }

    setToast({
      open: true,
      severity: "success",
      message: isProfessorMode
        ? "Professor assigned successfully."
        : "Assistant assigned successfully.",
    });
  }, [
    activeOffering,
    assignedAssistants,
    assignedProfessor,
    assignInstructor,
    clearError,
    isProfessorMode,
    selectedUser,
  ]);

  const handleUnassign = useCallback(
    async (userId, role) => {
      if (!activeOffering) return;
      setActionError("");
      clearError();

      const previousOffering = activeOffering;
      const previousProfessor = assignedProfessor;
      const previousAssistants = assignedAssistants;

      if (role === "professor") {
        setActiveOffering((prev) =>
          prev ? { ...prev, professorId: null } : prev
        );
        setAssignedProfessor(null);
      } else {
        setActiveOffering((prev) =>
          prev
            ? {
                ...prev,
                assistantIds: (prev.assistantIds || []).filter(
                  (id) => id !== userId
                ),
              }
            : prev
        );
        setAssignedAssistants((prev) =>
          prev.filter((assistant) => assistant.id !== userId)
        );
      }

      const result = await unassignInstructor({
        offeringId: activeOffering.id,
        userId,
        role,
      });

      if (!result.ok) {
        setActiveOffering(previousOffering);
        setAssignedProfessor(previousProfessor);
        setAssignedAssistants(previousAssistants);
        setActionError(result.error);
        setToast({
          open: true,
          severity: "error",
          message: result.error,
        });
        return;
      }

      if (result.data?.offering) {
        setActiveOffering(result.data.offering);
      }

      setToast({
        open: true,
        severity: "success",
        message:
          role === "professor"
            ? "Professor unassigned."
            : "Assistant unassigned.",
      });
    },
    [
      activeOffering,
      assignedAssistants,
      assignedProfessor,
      clearError,
      unassignInstructor,
    ]
  );

  const errorMessage = actionError || error;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isProfessorMode ? "Assign Professor" : "Assign Assistant/TA"}
      </DialogTitle>
      <DialogContent className="space-y-4">
        <div className="text-sm font-medium text-slate-600">{courseLabel}</div>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Step 1: Term + Section
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              select
              label="Term"
              value={termId}
              onChange={handleTermChange}
              fullWidth
              required
            >
              {TERM_OPTIONS.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Section Code"
              value={sectionCode}
              onChange={handleSectionChange}
              placeholder="A"
              fullWidth
              required
            />
            <TextField
              label="Capacity (optional)"
              value={capacity}
              onChange={handleCapacityChange}
              fullWidth
              type="number"
              inputProps={{ min: 0 }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outlined"
              onClick={handleLoadOffering}
              disabled={listLoading}
            >
              {listLoading ? "Loading..." : "Load Offering"}
            </Button>
            {missingOffering ? (
              <Button
                variant="contained"
                onClick={handleCreateOffering}
                disabled={actionLoading}
              >
                {actionLoading ? "Creating..." : "Create Offering"}
              </Button>
            ) : null}
          </div>

          {activeOffering ? (
            <Alert severity="success">Offering loaded.</Alert>
          ) : missingOffering ? (
            <Alert severity="warning">
              No offering found for this term/section. Create one to continue.
            </Alert>
          ) : null}
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Step 2: Assign {isProfessorMode ? "Professor" : "Assistant/TA"}
          </div>
          <Autocomplete
            value={selectedUser}
            onChange={(event, value) => setSelectedUser(value)}
            inputValue={userSearch}
            onInputChange={(event, value) => setUserSearch(value)}
            options={userOptions}
            loading={userLoading}
            getOptionLabel={getUserDisplayName}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={
                  isProfessorMode
                    ? "Search professor by name/email"
                    : "Search assistant/TA by name/email"
                }
                placeholder="Type at least 2 characters"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {userLoading ? (
                        <CircularProgress color="inherit" size={18} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">
                    {getUserDisplayName(option)}
                  </span>
                  {option.email ? (
                    <span className="text-xs text-slate-500">
                      {option.email}
                    </span>
                  ) : null}
                </div>
              </li>
            )}
            disabled={!activeOffering}
          />

          <div className="flex justify-end">
            <Button
              variant="contained"
              onClick={handleAssign}
              disabled={!selectedUser || actionLoading || !activeOffering}
            >
              {actionLoading ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Current Assignments
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-700">Professor</div>
            {assignedProfessor ? (
              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-700">
                  {getUserDisplayName(assignedProfessor)}
                </div>
                <Tooltip title="Unassign professor">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={actionLoading}
                      onClick={() => handleUnassign(assignedProfessor.id, "professor")}
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </span>
                </Tooltip>
              </div>
            ) : (
              <div className="text-xs text-slate-500">No professor assigned.</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-700">
              Assistants/TAs
            </div>
            {assignedAssistants.length === 0 ? (
              <div className="text-xs text-slate-500">
                No assistants assigned.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignedAssistants.map((assistant) => (
                  <div
                    key={assistant.id}
                    className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                  >
                    <span>{getUserDisplayName(assistant)}</span>
                    <Tooltip title="Unassign assistant">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={actionLoading}
                          onClick={() =>
                            handleUnassign(assistant.id, "assistant")
                          }
                        >
                          <DeleteIcon fontSize="inherit" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
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

export default CourseOfferingAssignmentDialog;
