import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const ASSIGNMENTS_COLLECTION = "courseAssignments";

const mapAssignment = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

export const fetchAssignments = async () => {
  const assignmentsRef = collection(db, ASSIGNMENTS_COLLECTION);
  const assignmentsQuery = query(assignmentsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(assignmentsQuery);
  return snapshot.docs.map(mapAssignment);
};

export const addAssignment = async (payload) => {
  const assignmentsRef = collection(db, ASSIGNMENTS_COLLECTION);
  const data = {
    ...payload,
    createdAt: payload.createdAt || serverTimestamp(),
  };
  const docRef = await addDoc(assignmentsRef, data);
  return { id: docRef.id, ...data };
};

export const updateAssignment = async (assignmentId, payload) => {
  const assignmentRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
  await updateDoc(assignmentRef, payload);
  return { id: assignmentId, ...payload };
};

export const deleteAssignment = async (assignmentId) => {
  const assignmentRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
  await deleteDoc(assignmentRef);
  return assignmentId;
};
