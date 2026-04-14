import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export const COURSES_COLLECTION = "allCourses";

export const fetchAllCourses = async (db) => {
  const snapshot = await getDocs(collection(db, COURSES_COLLECTION));
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

export const fetchCourseById = async (db, id) => {
  if (!id) return null;
  const snapshot = await getDoc(doc(db, COURSES_COLLECTION, id));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
};
