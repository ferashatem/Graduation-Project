import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  departmentDoc,
  departmentsCollection,
} from "../../../firebase/firestorePaths";

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

export const fetchDepartments = async (collegeId, yearId) => {
  const snapshot = await getDocs(departmentsCollection(collegeId, yearId));
  return snapshot.docs.map(mapDoc);
};

export const getDepartmentById = async (collegeId, yearId, departmentId) => {
  const snapshot = await getDoc(
    departmentDoc(collegeId, yearId, departmentId)
  );
  if (!snapshot.exists()) return null;
  return mapDoc(snapshot);
};

export const createDepartment = async (collegeId, yearId, { name, code }) => {
  const payload = {
    name: name.trim(),
    createdAt: serverTimestamp(),
  };

  if (code && code.trim()) {
    payload.code = code.trim();
  }

  const docRef = await addDoc(departmentsCollection(collegeId, yearId), payload);
  return {
    id: docRef.id,
    ...payload,
    createdAt: new Date(),
  };
};

export const updateDepartment = async (
  collegeId,
  yearId,
  departmentId,
  updates
) => {
  const payload = {
    name: updates.name.trim(),
    code: updates.code ? updates.code.trim() : "",
  };

  await updateDoc(departmentDoc(collegeId, yearId, departmentId), payload);
  return payload;
};

export const deleteDepartment = async (collegeId, yearId, departmentId) => {
  await deleteDoc(departmentDoc(collegeId, yearId, departmentId));
  return departmentId;
};
