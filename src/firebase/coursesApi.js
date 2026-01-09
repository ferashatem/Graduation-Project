import { collectionGroup, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "./firebaseConfig";

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

export const fetchCollegeCourses = async (collegeId) => {
  if (!collegeId) return [];
  const coursesQuery = query(
    collectionGroup(db, "courses"),
    where("collegeId", "==", collegeId),
    orderBy("name")
  );
  const snapshot = await getDocs(coursesQuery);
  const courses = snapshot.docs.map(mapDoc);
  courses.sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""))
  );
  return courses;
};

