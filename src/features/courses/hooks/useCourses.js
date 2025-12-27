import { useCallback, useEffect, useState } from "react";
import {
  createCourse,
  deleteCourse,
  fetchCourses,
  updateCourse,
} from "../api/coursesApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

export const useCourses = (collegeId, yearId, departmentId) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourses = useCallback(async () => {
    if (!collegeId || !yearId || !departmentId) {
      setCourses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await fetchCourses(collegeId, yearId, departmentId);
      setCourses(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [collegeId, yearId, departmentId]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const addCourse = useCallback(
    async (payload) => {
      setError("");
      try {
        const created = await createCourse(
          collegeId,
          yearId,
          departmentId,
          payload
        );
        setCourses((prev) => [created, ...prev]);
        return { ok: true };
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        return { ok: false, error: message };
      }
    },
    [collegeId, departmentId, yearId]
  );

  const editCourse = useCallback(
    async (courseId, updates) => {
      const previous = courses;
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId ? { ...course, ...updates } : course
        )
      );
      try {
        await updateCourse(collegeId, yearId, departmentId, courseId, updates);
        return { ok: true };
      } catch (err) {
        const message = getErrorMessage(err);
        setCourses(previous);
        setError(message);
        return { ok: false, error: message };
      }
    },
    [collegeId, courses, departmentId, yearId]
  );

  const removeCourse = useCallback(
    async (courseId) => {
      const previous = courses;
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
      try {
        await deleteCourse(collegeId, yearId, departmentId, courseId);
        return { ok: true };
      } catch (err) {
        const message = getErrorMessage(err);
        setCourses(previous);
        setError(message);
        return { ok: false, error: message };
      }
    },
    [collegeId, courses, departmentId, yearId]
  );

  return {
    courses,
    loading,
    error,
    reload: loadCourses,
    addCourse,
    updateCourse: editCourse,
    deleteCourse: removeCourse,
  };
};
