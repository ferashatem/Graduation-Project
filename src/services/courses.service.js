import {
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db as appDb } from "../firebase/firebaseConfig";

const normalizeValue = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const normalizeIdArray = (values) => {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(values.map((value) => normalizeValue(value)).filter(Boolean))
  );
};

export const assignCourseStaff = async ({
  db,
  collegeId,
  yearId,
  departmentId,
  courseId,
  professorId,
  assistantIds,
}) => {
  const dbRef = db || appDb;
  if (!dbRef) throw new Error("db is required.");

  const trimmedCollegeId = normalizeValue(collegeId);
  const trimmedYearId = normalizeValue(yearId);
  const trimmedDepartmentId = normalizeValue(departmentId);
  const trimmedCourseId = normalizeValue(courseId);
  const trimmedProfessorId = normalizeValue(professorId);

  if (
    !trimmedCollegeId ||
    !trimmedYearId ||
    !trimmedDepartmentId ||
    !trimmedCourseId
  ) {
    throw new Error("Course path is incomplete.");
  }
  if (!trimmedProfessorId) {
    throw new Error("professorId is required.");
  }

  const payload = {
    professorId: trimmedProfessorId,
    assistantIds: normalizeIdArray(assistantIds),
    staffAssignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const courseRef = doc(
    dbRef,
    "colleges",
    trimmedCollegeId,
    "years",
    trimmedYearId,
    "departments",
    trimmedDepartmentId,
    "courses",
    trimmedCourseId
  );

  const batch = writeBatch(dbRef);
  batch.update(courseRef, payload);

  const allCoursesRef = doc(dbRef, "allCourses", trimmedCourseId);
  batch.update(allCoursesRef, payload);

  await batch.commit();
  return { id: trimmedCourseId, ...payload };
};
