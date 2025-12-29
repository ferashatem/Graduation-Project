import { doc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";
import {
  allCourseDoc,
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

  const courseRef = doc(coursesCollection(collegeId, yearId, departmentId));
  const allCoursesRef = allCourseDoc(courseRef.id);
  const batch = writeBatch(db);

  batch.set(courseRef, payload);
  batch.set(allCoursesRef, payload);

  await batch.commit();
  return {
    id: courseRef.id,
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

  const batch = writeBatch(db);
  batch.update(courseDoc(collegeId, yearId, departmentId, courseId), payload);
  batch.set(allCourseDoc(courseId), payload, { merge: true });
  await batch.commit();
  return payload;
};

export const deleteCourse = async (
  collegeId,
  yearId,
  departmentId,
  courseId
) => {
  const batch = writeBatch(db);
  batch.delete(courseDoc(collegeId, yearId, departmentId, courseId));
  batch.delete(allCourseDoc(courseId));
  await batch.commit();
  return courseId;
};
