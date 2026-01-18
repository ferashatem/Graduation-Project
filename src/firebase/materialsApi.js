import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { db, storage } from "./firebaseConfig";

const PROF_COURSES_COLLECTION = "prof_courses";

const mapCourseDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });
const mapMaterialDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

export const fetchProfessorCourses = async (professorId) => {
  if (!professorId) return [];
  const coursesRef = collection(db, PROF_COURSES_COLLECTION, professorId, "courses");
  const coursesQuery = query(coursesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(coursesQuery);
  return snapshot.docs.map(mapCourseDoc);
};

export const uploadMaterialPdf = async (
  file,
  { professorId, courseId, courseDocId, materialId }
) => {
  if (!file) {
    throw new Error("PDF file is required.");
  }
  if (!professorId) {
    throw new Error("professorId is required.");
  }
  if (!materialId) {
    throw new Error("materialId is required.");
  }

  const safeCourseId = courseId || courseDocId || "unknown-course";
  const storagePath = `materials/${professorId}/${safeCourseId}/${materialId}.pdf`;
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, file, {
    contentType: file.type || "application/pdf",
  });
  const pdfUrl = await getDownloadURL(fileRef);
  return { pdfUrl, storagePath };
};

export const createMaterialDoc = async ({
  professorId,
  courseDocId,
  courseId,
  courseName,
  lectureTitle,
  lectureNumber,
  notes,
  file,
}) => {
  if (!professorId) {
    throw new Error("professorId is required.");
  }
  if (!courseDocId) {
    throw new Error("courseDocId is required.");
  }

  const materialsRef = collection(
    db,
    PROF_COURSES_COLLECTION,
    professorId,
    "courses",
    courseDocId,
    "materials"
  );
  const docRef = doc(materialsRef);
  const materialId = docRef.id;

  const { pdfUrl, storagePath } = await uploadMaterialPdf(file, {
    professorId,
    courseId,
    courseDocId,
    materialId,
  });

  const payload = {
    materialId,
    professorId,
    courseDocId,
    courseId: courseId || "",
    courseName: courseName || "",
    lectureTitle: lectureTitle || "",
    lectureNumber: Number.isFinite(lectureNumber) ? lectureNumber : null,
    notes: notes || "",
    pdfUrl,
    storagePath,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, payload);

  return { id: materialId, ...payload };
};

export const fetchMaterialsForCourse = async (professorId, courseDocId) => {
  if (!professorId || !courseDocId) return [];
  const materialsRef = collection(
    db,
    PROF_COURSES_COLLECTION,
    professorId,
    "courses",
    courseDocId,
    "materials"
  );
  const materialsQuery = query(materialsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(materialsQuery);
  return snapshot.docs.map(mapMaterialDoc);
};

export const deleteMaterial = async ({
  professorId,
  courseDocId,
  materialId,
  storagePath,
}) => {
  if (!professorId || !courseDocId || !materialId) {
    throw new Error("Missing identifiers for deleting material.");
  }
  if (storagePath) {
    await deleteObject(ref(storage, storagePath));
  }
  const docRef = doc(
    db,
    PROF_COURSES_COLLECTION,
    professorId,
    "courses",
    courseDocId,
    "materials",
    materialId
  );
  await deleteDoc(docRef);
};
