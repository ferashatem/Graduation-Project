import {
  addDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  courseDoc,
  coursesCollection,
} from "../../../firebase/firestorePaths";

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

export const fetchCourses = async (collegeId, yearId, departmentId) => {
  const snapshot = await getDocs(
    coursesCollection(collegeId, yearId, departmentId)
  );
  return snapshot.docs.map(mapDoc);
};

export const createCourse = async (
  collegeId,
  yearId,
  departmentId,
  { name, code, creditHours, description }
) => {
  const payload = {
    name: name.trim(),
    code: code.trim(),
    creditHours: Number(creditHours),
    createdAt: serverTimestamp(),
  };

  if (description && description.trim()) {
    payload.description = description.trim();
  }

  const docRef = await addDoc(
    coursesCollection(collegeId, yearId, departmentId),
    payload
  );
  return {
    id: docRef.id,
    ...payload,
    createdAt: new Date(),
  };
};

export const updateCourse = async (
  collegeId,
  yearId,
  departmentId,
  courseId,
  updates
) => {
  const payload = {
    name: updates.name.trim(),
    code: updates.code.trim(),
    creditHours: Number(updates.creditHours),
    description: updates.description ? updates.description.trim() : "",
  };

  await updateDoc(
    courseDoc(collegeId, yearId, departmentId, courseId),
    payload
  );
  return payload;
};

export const deleteCourse = async (
  collegeId,
  yearId,
  departmentId,
  courseId
) => {
  await deleteDoc(courseDoc(collegeId, yearId, departmentId, courseId));
  return courseId;
};
