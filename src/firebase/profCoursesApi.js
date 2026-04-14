import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const PROF_COURSES_COLLECTION = "prof_courses";

const mapCourseDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

export const getProfCoursesOnce = async (profUid) => {
  if (!profUid) return [];
  const coursesRef = collection(db, PROF_COURSES_COLLECTION, profUid, "courses");
  const coursesQuery = query(coursesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(coursesQuery);
  return snapshot.docs.map(mapCourseDoc);
};

export const listenProfCourses = (profUid, onChange, onError) => {
  if (!profUid) return () => {};
  const coursesRef = collection(db, PROF_COURSES_COLLECTION, profUid, "courses");
  const coursesQuery = query(coursesRef, orderBy("createdAt", "desc"));
  return onSnapshot(
    coursesQuery,
    (snapshot) => {
      if (onChange) onChange(snapshot.docs.map(mapCourseDoc));
    },
    (error) => {
      console.error("[profCoursesApi] listenProfCourses error", error);
      if (onError) onError(error);
    }
  );
};

export const listenProfessorCourses = (profUid, onChange, onError) =>
  listenProfCourses(profUid, onChange, onError);

export const getProfessorCourseById = async (profUid, courseDocId) => {
  if (!profUid || !courseDocId) return null;
  const courseRef = doc(
    db,
    PROF_COURSES_COLLECTION,
    profUid,
    "courses",
    courseDocId
  );
  const snapshot = await getDoc(courseRef);
  if (!snapshot.exists()) return null;
  return mapCourseDoc(snapshot);
};
