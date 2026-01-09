import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { fetchCollegeCourses } from "../../firebase/coursesApi";
import { createSchedule, updateSchedule } from "../../firebase/scheduleApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const buildCourseLabel = (course) => {
  if (!course) return "";
  if (course.code) return `${course.code} - ${course.name || "Course"}`;
  return course.name || "Course";
};

function AddCourseToSlotModal({
  open,
  collegeId,
  buildingId,
  roomId,
  dayKey,
  slotKey,
  startTime,
  endTime,
  schedule,
  canManage,
  onClose,
  onSaved,
}) {
  const cacheRef = useRef(new Map());
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState("");

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [section, setSection] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");

  const isEdit = useMemo(() => Boolean(schedule?.id), [schedule]);
  const canEdit = useMemo(() => Boolean(canManage), [canManage]);

  useEffect(() => {
    if (!open) return;
    setSelectedCourseId(schedule?.courseId || "");
    setInstructorName(schedule?.instructorName || "");
    setInstructorId(schedule?.instructorId || "");
    setSection(schedule?.section || "");
    setLocalError("");
  }, [open, schedule]);

  useEffect(() => {
    if (!open || !collegeId) return;
    const cached = cacheRef.current.get(collegeId);
    if (cached) {
      setCourses(cached);
      setCoursesError("");
      return;
    }

    let isActive = true;
    setCoursesLoading(true);
    setCoursesError("");

    fetchCollegeCourses(collegeId)
      .then((data) => {
        if (!isActive) return;
        cacheRef.current.set(collegeId, data);
        setCourses(data);
      })
      .catch((err) => {
        if (!isActive) return;
        console.error("[AddCourseToSlotModal] Failed to load courses:", err);
        setCoursesError(getErrorMessage(err));
      })
      .finally(() => {
        if (!isActive) return;
        setCoursesLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [collegeId, open]);

  const selectedCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    const match = courses.find((course) => course.id === selectedCourseId);
    if (match) return match;
    if (schedule?.courseId === selectedCourseId) {
      return {
        id: schedule.courseId,
        name: schedule.courseName || "",
        code: schedule.courseCode || "",
      };
    }
    return null;
  }, [courses, schedule, selectedCourseId]);

  const courseOptions = useMemo(() => {
    if (selectedCourse && !courses.some((course) => course.id === selectedCourse.id)) {
      return [selectedCourse, ...courses];
    }
    return courses;
  }, [courses, selectedCourse]);

  const modalTitle = useMemo(() => {
    if (!dayKey || !slotKey) return "Schedule course";
    return isEdit ? "Edit booking" : "Add course to slot";
  }, [dayKey, isEdit, slotKey]);

  const courseHelperText = useMemo(() => {
    if (coursesLoading) return "Loading courses...";
    if (coursesError) return "Failed to load courses.";
    if (courseOptions.length === 0) return "No courses found for this college.";
    return "Select a course for this slot.";
  }, [courseOptions.length, coursesError, coursesLoading]);

  const handleClose = useCallback(() => {
    if (saving) return;
    if (onClose) onClose();
  }, [onClose, saving]);

  const handleCourseChange = useCallback((event, value) => {
    setSelectedCourseId(value?.id || "");
  }, []);

  const handleSave = useCallback(async () => {
    if (!canEdit) return;
    if (saving) return;
    setLocalError("");

    if (!collegeId || !buildingId || !roomId || !dayKey || !slotKey) {
      setLocalError("Missing schedule context.");
      return;
    }

    if (!selectedCourse) {
      setLocalError("Please select a course.");
      return;
    }

    const payload = {
      dayKey,
      slotKey,
      startTime,
      endTime,
      courseId: selectedCourse.id,
      courseName: selectedCourse.name || "",
      courseCode: selectedCourse.code || "",
      instructorId: instructorId.trim(),
      instructorName: instructorName.trim(),
      section: section.trim(),
    };

    setSaving(true);
    try {
      if (isEdit && schedule?.id) {
        await updateSchedule(collegeId, buildingId, roomId, schedule.id, payload);
      } else {
        await createSchedule(collegeId, buildingId, roomId, payload);
      }
      if (onSaved) onSaved();
      if (onClose) onClose();
    } catch (err) {
      console.error("[AddCourseToSlotModal] Failed to save schedule:", err);
      if (err?.code === "slot-already-booked") {
        setLocalError(
          "This slot is already booked. Open the slot to view details."
        );
      } else {
        setLocalError(getErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  }, [
    buildingId,
    canEdit,
    collegeId,
    dayKey,
    endTime,
    instructorId,
    instructorName,
    isEdit,
    onClose,
    onSaved,
    roomId,
    schedule,
    section,
    selectedCourse,
    saving,
    slotKey,
    startTime,
  ]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{modalTitle}</DialogTitle>
      <DialogContent className="space-y-4">
        {coursesError ? <Alert severity="warning">{coursesError}</Alert> : null}
        {localError ? <Alert severity="error">{localError}</Alert> : null}

        <Autocomplete
          value={selectedCourse}
          onChange={handleCourseChange}
          options={courseOptions}
          loading={coursesLoading}
          getOptionLabel={buildCourseLabel}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          noOptionsText={
            coursesLoading ? "Loading courses..." : "No courses found"
          }
          renderOption={(props, option) => {
            const department =
              option.departmentName || option.department || option.departmentId;
            const year = option.yearName || option.yearId;
            const secondary =
              department && year ? `${department} / ${year}` : department || year;
            return (
              <li {...props} key={option.id}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">
                    {buildCourseLabel(option)}
                  </span>
                  {secondary ? (
                    <span className="text-xs text-slate-500">{secondary}</span>
                  ) : null}
                </div>
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Course"
              placeholder="Select a course"
              helperText={courseHelperText}
              required
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {coursesLoading ? (
                      <CircularProgress color="inherit" size={18} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          disabled={!canEdit}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <TextField
            label="Instructor name"
            value={instructorName}
            onChange={(event) => setInstructorName(event.target.value)}
            disabled={!canEdit}
            fullWidth
          />
          <TextField
            label="Instructor ID"
            value={instructorId}
            onChange={(event) => setInstructorId(event.target.value)}
            disabled={!canEdit}
            fullWidth
          />
          <TextField
            label="Section"
            value={section}
            onChange={(event) => setSection(event.target.value)}
            disabled={!canEdit}
            fullWidth
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Close
        </Button>
        {canEdit ? (
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Course"}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}

export default AddCourseToSlotModal;
