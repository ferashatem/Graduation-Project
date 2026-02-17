import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db as appDb } from "../firebase/firebaseConfig";

const ROLE_COLLECTIONS = {
  professor: "profs",
  assistant: "assistants",
  student: "students",
  admin: "admins",
  super_admin: "super_admins",
};

const ROLE_REQUIRES_COLLEGE = ["professor", "assistant", "student"];

const normalizeRole = (role) => String(role || "").trim().toLowerCase();
const normalizeValue = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const professorCache = new Map();

export const getRoleCollection = (role) =>
  ROLE_COLLECTIONS[normalizeRole(role)] || "";

export const createUserProfile = async ({
  db,
  uid,
  name,
  email,
  phoneNumber,
  role,
  collegeId,
}) => {
  if (!db) throw new Error("db is required.");
  const trimmedUid = normalizeValue(uid);
  if (!trimmedUid) throw new Error("uid is required.");

  const normalizedRole = normalizeRole(role);
  const roleCollection = getRoleCollection(normalizedRole);
  if (!roleCollection) throw new Error("Role is not supported.");

  const profile = {
    uid: trimmedUid,
    name: normalizeValue(name),
    email: normalizeValue(email),
    role: normalizedRole,
    createdAt: serverTimestamp(),
  };

  const trimmedPhone = normalizeValue(phoneNumber);
  if (trimmedPhone) {
    profile.phoneNumber = trimmedPhone;
  }

  const shouldIncludeCollege = ROLE_REQUIRES_COLLEGE.includes(normalizedRole);
  const trimmedCollegeId = normalizeValue(collegeId);
  if (shouldIncludeCollege) {
    if (!trimmedCollegeId) {
      throw new Error("collegeId is required for the selected role.");
    }
    profile.collegeId = trimmedCollegeId;
  }

  await setDoc(doc(db, "users", trimmedUid), profile, { merge: true });
  await setDoc(
    doc(db, "users", "roles", roleCollection, trimmedUid),
    profile,
    { merge: true }
  );

  return { uid: trimmedUid, ...profile };
};

export const getProfsByCollege = async ({ db, collegeId }) => {
  return getProfsByCollegeId(collegeId, db);
};

export const getProfsByCollegeId = async (collegeId, dbRef = appDb) => {
  if (!dbRef) throw new Error("db is required.");
  const trimmedCollegeId = normalizeValue(collegeId);
  if (!trimmedCollegeId) return [];

  const snapshot = await getDocs(
    query(
      collection(dbRef, "users", "roles", "profs"),
      where("collegeId", "==", trimmedCollegeId)
    )
  );

  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};

export const getAssistantsByCollegeId = async (collegeId, dbRef = appDb) => {
  if (!dbRef) throw new Error("db is required.");
  const trimmedCollegeId = normalizeValue(collegeId);
  if (!trimmedCollegeId) return [];

  const snapshot = await getDocs(
    query(
      collection(dbRef, "users", "roles", "assistants"),
      where("collegeId", "==", trimmedCollegeId)
    )
  );

  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};

export const getProfessorById = async ({ db, professorId } = {}) => {
  const dbRef = db || appDb;
  if (!dbRef) throw new Error("db is required.");
  const trimmedProfessorId = normalizeValue(professorId);
  if (!trimmedProfessorId) return null;

  if (professorCache.has(trimmedProfessorId)) {
    return professorCache.get(trimmedProfessorId);
  }

  const snapshot = await getDoc(
    doc(dbRef, "users", "roles", "profs", trimmedProfessorId)
  );
  const data = snapshot.exists()
    ? { id: snapshot.id, ...snapshot.data() }
    : null;

  professorCache.set(trimmedProfessorId, data);
  return data;
};
