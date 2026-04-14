import { collection, getDocs, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "./firebaseConfig";

const ASSISTANT_COURSES_COLLECTION = "assistant_courses";

const mapCourseDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

export const getAssistantCoursesOnce = async (assistantUid) => {
  if (!assistantUid) return [];
  const coursesRef = collection(
    db,
    ASSISTANT_COURSES_COLLECTION,
    assistantUid,
    "courses"
  );
  const coursesQuery = query(coursesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(coursesQuery);
  return snapshot.docs.map(mapCourseDoc);
};

export const listenAssistantCourses = (assistantUid, onChange, onError) => {
  if (!assistantUid) return () => {};
  const coursesRef = collection(
    db,
    ASSISTANT_COURSES_COLLECTION,
    assistantUid,
    "courses"
  );
  const coursesQuery = query(coursesRef, orderBy("createdAt", "desc"));
  return onSnapshot(
    coursesQuery,
    (snapshot) => {
      if (onChange) onChange(snapshot.docs.map(mapCourseDoc));
    },
    (error) => {
      console.error(
        "[assistantCoursesApi] listenAssistantCourses error",
        error
      );
      if (onError) onError(error);
    }
  );
};
