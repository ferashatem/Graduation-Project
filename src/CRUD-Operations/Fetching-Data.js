import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

// ✅ fetch students by College_ID (matches Firestore exactly)
export async function fetchStudentsByCollege(collegeId) {
  const q = query(
    collection(db, "students"),
    where("College_ID", "==", collegeId) // ✅ correct: College_ID
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}
