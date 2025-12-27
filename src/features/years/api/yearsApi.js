import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { yearDoc, yearsCollection } from "../../../firebase/firestorePaths";

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

export const fetchYears = async (collegeId) => {
  const yearsQuery = query(yearsCollection(collegeId), orderBy("order", "asc"));
  const snapshot = await getDocs(yearsQuery);
  return snapshot.docs.map(mapDoc);
};

export const getYearById = async (collegeId, yearId) => {
  const snapshot = await getDoc(yearDoc(collegeId, yearId));
  if (!snapshot.exists()) return null;
  return mapDoc(snapshot);
};

export const createYear = async (collegeId, { name, order }) => {
  const payload = {
    name: name.trim(),
    order: Number(order),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(yearsCollection(collegeId), payload);
  return {
    id: docRef.id,
    ...payload,
    createdAt: new Date(),
  };
};

export const updateYear = async (collegeId, yearId, updates) => {
  const payload = {
    name: updates.name.trim(),
    order: Number(updates.order),
  };

  await updateDoc(yearDoc(collegeId, yearId), payload);
  return payload;
};

export const deleteYear = async (collegeId, yearId) => {
  await deleteDoc(yearDoc(collegeId, yearId));
  return yearId;
};
