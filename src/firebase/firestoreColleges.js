import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "./firebaseConfig";

const COLLEGES_COLLECTION = "colleges";

const mapCollege = (snapshot) => {
  const data = snapshot.data() || {};
  return {
    id: snapshot.id,
    name: data.name || "",
    code: data.code || "",
  };
};

export const getCollegeById = async (collegeId) => {
  if (!collegeId) return null;
  const snap = await getDoc(doc(db, COLLEGES_COLLECTION, collegeId));
  if (!snap.exists()) return null;
  return mapCollege(snap);
};

export const fetchColleges = async () => {
  const collegesRef = collection(db, COLLEGES_COLLECTION);
  const collegesQuery = query(collegesRef, orderBy("name"));
  const snapshot = await getDocs(collegesQuery);
  const colleges = snapshot.docs.map(mapCollege);

  colleges.sort((a, b) => a.name.localeCompare(b.name));
  return colleges;
};
