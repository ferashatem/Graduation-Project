import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import {
  generateSlots,
  isOverlapping,
  minutesToTime,
  timeToMinutes,
} from "../../services/campusBuildings.service";

const DAY_OPTIONS = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
  { value: "SAT", label: "Saturday" },
  { value: "SUN", label: "Sunday" },
];

const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

function AddEditScheduleModal({
  open,
  initialValues,
  existingSchedules = [],
  loading,
  error,
  onClose,
  onSubmit,
}) {
  const isEdit = Boolean(initialValues?.id);

  // ── Time fields ───────────────────────────────────────────────────────────────
  const [day, setDay] = useState("MON");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [validationError, setValidationError] = useState("");

  // ── Course cascade state ──────────────────────────────────────────────────────
  const [cascadeTouched, setCascadeTouched] = useState(false);

  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [collegesError, setCollegesError] = useState("");
  const [selectedCollegeId, setSelectedCollegeId] = useState("");

  const [years, setYears] = useState([]);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [yearsError, setYearsError] = useState("");
  const [selectedYearId, setSelectedYearId] = useState("");

  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  // Stale-request guards
  const yearReqRef = useRef(0);
  const deptReqRef = useRef(0);
  const courseReqRef = useRef(0);

  const timeOptions = useMemo(() => {
    const options = [];
    for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
      options.push(minutesToTime(minutes));
    }
    return options;
  }, []);

  // ── Fetch functions ───────────────────────────────────────────────────────────

  const fetchColleges = useCallback(async () => {
    setCollegesLoading(true);
    setCollegesError("");
    try {
      const snap = await getDocs(collection(db, "colleges"));
      setColleges(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      setCollegesError("Failed to load options. Try again.");
    } finally {
      setCollegesLoading(false);
    }
  }, []);

  const fetchYears = useCallback(async (collegeId) => {
    if (!collegeId) return;
    const reqId = ++yearReqRef.current;
    setYearsLoading(true);
    setYearsError("");
    try {
      const q = query(
        collection(db, "colleges", collegeId, "years"),
        orderBy("order", "asc")
      );
      const snap = await getDocs(q);
      if (reqId !== yearReqRef.current) return;
      setYears(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      if (reqId !== yearReqRef.current) return;
      setYearsError("Failed to load options. Try again.");
    } finally {
      if (reqId === yearReqRef.current) setYearsLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async (collegeId, yearId) => {
    if (!collegeId || !yearId) return;
    const reqId = ++deptReqRef.current;
    setDepartmentsLoading(true);
    setDepartmentsError("");
    try {
      const snap = await getDocs(
        collection(db, "colleges", collegeId, "years", yearId, "departments")
      );
      if (reqId !== deptReqRef.current) return;
      setDepartments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      if (reqId !== deptReqRef.current) return;
      setDepartmentsError("Failed to load options. Try again.");
    } finally {
      if (reqId === deptReqRef.current) setDepartmentsLoading(false);
    }
  }, []);

  const fetchCourses = useCallback(async (collegeId, yearId, deptId) => {
    if (!collegeId || !yearId || !deptId) return;
    const reqId = ++courseReqRef.current;
    setCoursesLoading(true);
    setCoursesError("");
    try {
      const snap = await getDocs(
        collection(
          db,
          "colleges",
          collegeId,
          "years",
          yearId,
          "departments",
          deptId,
          "courses"
        )
      );
      if (reqId !== courseReqRef.current) return;
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      if (reqId !== courseReqRef.current) return;
      setCoursesError("Failed to load options. Try again.");
    } finally {
      if (reqId === courseReqRef.current) setCoursesLoading(false);
    }
  }, []);

  // ── Reset on open ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const initialDay = String(initialValues?.day || "MON").toUpperCase();
    setDay(initialDay || "MON");
    setStartTime(
      Number.isFinite(Number(initialValues?.startMin))
        ? minutesToTime(Number(initialValues.startMin))
        : "09:00"
    );
    setEndTime(
      Number.isFinite(Number(initialValues?.endMin))
        ? minutesToTime(Number(initialValues.endMin))
        : "10:00"
    );
    setValidationError("");

    // Reset cascade
    setCascadeTouched(false);
    setSelectedCollegeId("");
    setSelectedYearId("");
    setSelectedDepartmentId("");
    setSelectedCourseId("");
    setColleges([]);
    setYears([]);
    setDepartments([]);
    setCourses([]);
    setCollegesError("");
    setYearsError("");
    setDepartmentsError("");
    setCoursesError("");
    yearReqRef.current++;
    deptReqRef.current++;
    courseReqRef.current++;

    fetchColleges();
  }, [initialValues, open, fetchColleges]);

  // ── Cascade change handlers ───────────────────────────────────────────────────

  const handleCollegeChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSelectedCollegeId(value);
      setSelectedYearId("");
      setSelectedDepartmentId("");
      setSelectedCourseId("");
      setYears([]);
      setDepartments([]);
      setCourses([]);
      setYearsError("");
      setDepartmentsError("");
      setCoursesError("");
      setCascadeTouched(true);
      if (value) fetchYears(value);
    },
    [fetchYears]
  );

  const handleYearChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSelectedYearId(value);
      setSelectedDepartmentId("");
      setSelectedCourseId("");
      setDepartments([]);
      setCourses([]);
      setDepartmentsError("");
      setCoursesError("");
      setCascadeTouched(true);
      if (value && selectedCollegeId) {
        fetchDepartments(selectedCollegeId, value);
      }
    },
    [fetchDepartments, selectedCollegeId]
  );

  const handleDepartmentChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSelectedDepartmentId(value);
      setSelectedCourseId("");
      setCourses([]);
      setCoursesError("");
      setCascadeTouched(true);
      if (value && selectedCollegeId && selectedYearId) {
        fetchCourses(selectedCollegeId, selectedYearId, value);
      }
    },
    [fetchCourses, selectedCollegeId, selectedYearId]
  );

  const handleCourseChange = useCallback((e) => {
    setSelectedCourseId(e.target.value);
    setCascadeTouched(true);
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────────

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  // ── Modal handlers ────────────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    if (loading) return;
    if (onClose) onClose();
  }, [loading, onClose]);

  const handleSave = useCallback(() => {
    setValidationError("");
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const dayKey = String(day || "").toUpperCase();

    if (!dayKey) {
      setValidationError("Day is required.");
      return;
    }
    if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) {
      setValidationError("Select a valid start and end time.");
      return;
    }
    if (startMin >= endMin) {
      setValidationError("Start time must be before end time.");
      return;
    }
    if (startMin % 30 !== 0 || endMin % 30 !== 0) {
      setValidationError("Times must align with 30-minute steps.");
      return;
    }

    const overlap = existingSchedules.find((schedule) => {
      if (schedule.id === initialValues?.id) return false;
      const scheduleDay = String(schedule.day || "").toUpperCase();
      if (scheduleDay !== dayKey) return false;
      return isOverlapping(startMin, endMin, schedule.startMin, schedule.endMin);
    });

    if (overlap) {
      const conflictStart = minutesToTime(overlap.startMin);
      const conflictEnd = minutesToTime(overlap.endMin);
      setValidationError(
        `Overlaps with ${conflictStart} - ${conflictEnd} on ${dayKey}.`
      );
      return;
    }

    const slots = generateSlots(dayKey, startMin, endMin, 30);
    if (slots.length === 0) {
      setValidationError("Select a valid time range.");
      return;
    }

    // Resolve course info — keep original values unless the cascade was used
    let courseId, courseName, courseCode;
    if (cascadeTouched) {
      courseId = selectedCourse?.id || null;
      courseName = selectedCourse?.name || null;
      courseCode = selectedCourse?.code || null;
    } else if (isEdit) {
      courseId = initialValues?.courseId || null;
      courseName = initialValues?.courseName || null;
      courseCode = initialValues?.courseCode || null;
    } else {
      courseId = null;
      courseName = null;
      courseCode = null;
    }

    if (onSubmit) {
      onSubmit({
        day: dayKey,
        startMin,
        endMin,
        courseId,
        courseName,
        courseCode,
        slots,
      });
    }
  }, [
    cascadeTouched,
    day,
    endTime,
    existingSchedules,
    initialValues,
    isEdit,
    onSubmit,
    selectedCourse,
    startTime,
  ]);

  // ── Cascade select render helper ──────────────────────────────────────────────

  const renderCascadeSelect = ({
    label,
    value,
    onChange,
    options,
    optionLabel,
    isLoading,
    isDisabled,
    errorMsg,
    onRetry,
  }) => (
    <div>
      <TextField
        select
        label={label}
        value={value}
        onChange={onChange}
        fullWidth
        disabled={loading || isDisabled || isLoading}
        {...(isLoading
          ? {
              InputProps: {
                startAdornment: (
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                ),
              },
              InputLabelProps: { shrink: true },
            }
          : {})}
      >
        <MenuItem value="" sx={{ display: "none" }} />
        {options.map((opt) => (
          <MenuItem key={opt.id} value={opt.id}>
            {optionLabel(opt)}
          </MenuItem>
        ))}
      </TextField>
      {errorMsg ? (
        <div className="mt-1 flex items-center gap-2 text-xs text-red-600">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={onRetry}
            className="font-medium underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Schedule" : "Add Time Slot"}</DialogTitle>
      <DialogContent className="space-y-4">
        {error ? <Alert severity="error">{error}</Alert> : null}
        {validationError ? (
          <Alert severity="error">{validationError}</Alert>
        ) : null}

        <TextField
          select
          label="Day"
          value={day}
          onChange={(event) => setDay(event.target.value)}
          fullWidth
          disabled={loading}
        >
          {DAY_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            select
            label="Start time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            fullWidth
            disabled={loading}
          >
            {timeOptions.map((option) => (
              <MenuItem key={`start-${option}`} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="End time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            fullWidth
            disabled={loading}
          >
            {timeOptions.map((option) => (
              <MenuItem key={`end-${option}`} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </div>

        {/* Course cascade section */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mb: 1.5 }}
          >
            Course (optional)
          </Typography>

          {isEdit &&
          !cascadeTouched &&
          (initialValues?.courseName || initialValues?.courseId) ? (
            <div className="mb-3 rounded-md bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
              Currently: {initialValues.courseName || "Unknown"}
              {initialValues.courseCode
                ? ` (${initialValues.courseCode})`
                : ""}
            </div>
          ) : null}

          <div className="space-y-3">
            {renderCascadeSelect({
              label: "College",
              value: selectedCollegeId,
              onChange: handleCollegeChange,
              options: colleges,
              optionLabel: (c) => c.name,
              isLoading: collegesLoading,
              isDisabled: false,
              errorMsg: collegesError,
              onRetry: fetchColleges,
            })}

            {renderCascadeSelect({
              label: "Year",
              value: selectedYearId,
              onChange: handleYearChange,
              options: years,
              optionLabel: (y) => capitalize(y.name),
              isLoading: yearsLoading,
              isDisabled: !selectedCollegeId,
              errorMsg: yearsError,
              onRetry: () => fetchYears(selectedCollegeId),
            })}

            {renderCascadeSelect({
              label: "Department",
              value: selectedDepartmentId,
              onChange: handleDepartmentChange,
              options: departments,
              optionLabel: (d) => d.name,
              isLoading: departmentsLoading,
              isDisabled: !selectedYearId,
              errorMsg: departmentsError,
              onRetry: () =>
                fetchDepartments(selectedCollegeId, selectedYearId),
            })}

            {renderCascadeSelect({
              label: "Course",
              value: selectedCourseId,
              onChange: handleCourseChange,
              options: courses,
              optionLabel: (c) =>
                c.code ? `${c.name} \u2014 ${c.code}` : c.name,
              isLoading: coursesLoading,
              isDisabled: !selectedDepartmentId,
              errorMsg: coursesError,
              onRetry: () =>
                fetchCourses(
                  selectedCollegeId,
                  selectedYearId,
                  selectedDepartmentId
                ),
            })}
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Slot"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddEditScheduleModal;
