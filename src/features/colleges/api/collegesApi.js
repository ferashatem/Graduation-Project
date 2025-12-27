import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { collegesCollection, collegeDoc } from "../../../firebase/firestorePaths";

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

export const fetchColleges = async () => {
  const snapshot = await getDocs(collegesCollection());
  return snapshot.docs.map(mapDoc);
};

export const getCollegeById = async (collegeId) => {
  const snapshot = await getDoc(collegeDoc(collegeId));
  if (!snapshot.exists()) return null;
  return mapDoc(snapshot);
};

export const createCollege = async ({ name, code }) => {
  const payload = {
    name: name.trim(),
    createdAt: serverTimestamp(),
  };

  if (code && code.trim()) {
    payload.code = code.trim();
  }

  const docRef = await addDoc(collegesCollection(), payload);
  return {
    id: docRef.id,
    ...payload,
    createdAt: new Date(),
  };
};

export const updateCollege = async (collegeId, updates) => {
  const payload = {
    name: updates.name.trim(),
    code: updates.code ? updates.code.trim() : "",
  };

  await updateDoc(collegeDoc(collegeId), payload);
  return payload;
};

export const deleteCollege = async (collegeId) => {
  await deleteDoc(collegeDoc(collegeId));
  return collegeId;
};
