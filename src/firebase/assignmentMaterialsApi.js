import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebaseConfig";

const materialsRef = (assignmentId) =>
  collection(db, "courseAssignments", assignmentId, "materials");

const materialDocRef = (assignmentId, materialId) =>
  doc(db, "courseAssignments", assignmentId, "materials", materialId);

export const uploadAssignmentMaterial = async (
  file,
  { assignmentId, uploaderId, materialId }
) => {
  const storagePath = `assignmentMaterials/${assignmentId}/${materialId}.pdf`;
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, file, { contentType: file.type || "application/pdf" });
  const pdfUrl = await getDownloadURL(fileRef);
  return { pdfUrl, storagePath };
};

export const createAssignmentMaterial = async ({
  assignmentId,
  uploaderId,
  uploaderName,
  courseId,
  courseName,
  lectureTitle,
  lectureNumber,
  notes,
  file,
}) => {
  if (!assignmentId) throw new Error("assignmentId is required.");
  if (!uploaderId) throw new Error("uploaderId is required.");

  const docRef = doc(materialsRef(assignmentId));
  const materialId = docRef.id;

  const { pdfUrl, storagePath } = await uploadAssignmentMaterial(file, {
    assignmentId,
    uploaderId,
    materialId,
  });

  const payload = {
    materialId,
    assignmentId,
    uploaderId,
    uploaderName: uploaderName || "",
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

  await addDoc(materialsRef(assignmentId), payload);
  return { id: materialId, ...payload };
};

export const fetchAssignmentMaterials = async (assignmentId) => {
  if (!assignmentId) return [];
  const q = query(materialsRef(assignmentId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listenAssignmentMaterials = (assignmentId, onChange, onError) => {
  if (!assignmentId) return () => {};
  const q = query(materialsRef(assignmentId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onError);
};

export const deleteAssignmentMaterial = async ({ assignmentId, materialId, storagePath }) => {
  if (!assignmentId || !materialId) throw new Error("Missing identifiers.");
  if (storagePath) {
    await deleteObject(ref(storage, storagePath)).catch(() => {});
  }
  await deleteDoc(materialDocRef(assignmentId, materialId));
};
