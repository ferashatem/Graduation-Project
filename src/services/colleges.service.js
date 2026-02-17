import { collection, getDocs } from "firebase/firestore";

export const fetchColleges = async (db) => {
  if (!db) throw new Error("db is required.");
  const snapshot = await getDocs(collection(db, "colleges"));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};
