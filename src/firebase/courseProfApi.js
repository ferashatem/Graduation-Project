import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "./firebaseConfig";
import { getErrorMessage } from "../utils/errorHelpers";

const COURSE_PROF_COLLECTION = "course_prof";

const mapCourseDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

export const getProfessorCourses = async (profUid) => {
  if (!profUid) return [];
  const coursesRef = collection(db, COURSE_PROF_COLLECTION, profUid, "courses");
  const coursesQuery = query(coursesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(coursesQuery);
  return snapshot.docs.map(mapCourseDoc);
};

export const listenProfessorCourses = (profUid, onChange, onError) => {
  if (!profUid) return () => {};
  const coursesRef = collection(db, COURSE_PROF_COLLECTION, profUid, "courses");
  const coursesQuery = query(coursesRef, orderBy("createdAt", "desc"));
  return onSnapshot(
    coursesQuery,
    (snapshot) => {
      if (onChange) onChange(snapshot.docs.map(mapCourseDoc));
    },
    (error) => {
      console.error("[courseProfApi] listenProfessorCourses error", error);
      if (onError) onError(error);
    }
  );
};

export const rebuildProfessorCourseIndex = async (profUid, options = {}) => {
  const { enabled = false } = options;
  if (!enabled) {
    throw new Error(
      "Rebuild disabled by default. Pass { enabled: true } to run."
    );
  }
  if (!profUid) throw new Error("profUid is required.");

  try {
    if (auth?.currentUser) {
      await auth.currentUser.getIdToken(true);
    }
    const fn = httpsCallable(functions, "rebuildProfessorCourseIndex");
    const result = await fn({ profUid });
    return result.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to rebuild professor index."));
  }
};
