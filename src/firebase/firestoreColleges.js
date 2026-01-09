import { collection, getDocs, orderBy, query } from "firebase/firestore";
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

export const fetchColleges = async () => {
  const collegesRef = collection(db, COLLEGES_COLLECTION);
  const collegesQuery = query(collegesRef, orderBy("name"));
  const snapshot = await getDocs(collegesQuery);
  const colleges = snapshot.docs.map(mapCollege);

  colleges.sort((a, b) => a.name.localeCompare(b.name));
  return colleges;
};
