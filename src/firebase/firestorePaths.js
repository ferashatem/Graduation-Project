import { collection, doc } from "firebase/firestore";
import { db } from "./firebaseConfig";

const COLLECTIONS = {
  colleges: "colleges",
  years: "years",
  departments: "departments",
  courses: "courses",
};

export const collegesCollection = () => collection(db, COLLECTIONS.colleges);
export const collegeDoc = (collegeId) => doc(db, COLLECTIONS.colleges, collegeId);

export const yearsCollection = (collegeId) =>
  collection(db, COLLECTIONS.colleges, collegeId, COLLECTIONS.years);
export const yearDoc = (collegeId, yearId) =>
  doc(db, COLLECTIONS.colleges, collegeId, COLLECTIONS.years, yearId);

export const departmentsCollection = (collegeId, yearId) =>
  collection(
    db,
    COLLECTIONS.colleges,
    collegeId,
    COLLECTIONS.years,
    yearId,
    COLLECTIONS.departments
  );
export const departmentDoc = (collegeId, yearId, departmentId) =>
  doc(
    db,
    COLLECTIONS.colleges,
    collegeId,
    COLLECTIONS.years,
    yearId,
    COLLECTIONS.departments,
    departmentId
  );

export const coursesCollection = (collegeId, yearId, departmentId) =>
  collection(
    db,
    COLLECTIONS.colleges,
    collegeId,
    COLLECTIONS.years,
    yearId,
    COLLECTIONS.departments,
    departmentId,
    COLLECTIONS.courses
  );
export const courseDoc = (collegeId, yearId, departmentId, courseId) =>
  doc(
    db,
    COLLECTIONS.colleges,
    collegeId,
    COLLECTIONS.years,
    yearId,
    COLLECTIONS.departments,
    departmentId,
    COLLECTIONS.courses,
    courseId
  );
