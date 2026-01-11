import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const ASSIGNMENTS_COLLECTION = "courseAssignments";

export const createAssignment = async (payload) => {
  const assignmentsRef = collection(db, ASSIGNMENTS_COLLECTION);
  const data = {
    ...payload,
    createdAt: payload?.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(assignmentsRef, data);
  return { id: docRef.id, ...data };
};

export const updateAssignment = async (assignmentId, payload) => {
  if (!assignmentId) throw new Error("assignmentId is required.");
  const assignmentRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
  const data = {
    ...payload,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(assignmentRef, data);
  return { id: assignmentId, ...data };
};

export const deleteAssignment = async (assignmentId) => {
  if (!assignmentId) throw new Error("assignmentId is required.");
  const assignmentRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
  await deleteDoc(assignmentRef);
  return assignmentId;
};

// Backwards-compatible aliases.
export const createCourseAssignment = createAssignment;
export const updateCourseAssignment = updateAssignment;
export const deleteCourseAssignment = deleteAssignment;
