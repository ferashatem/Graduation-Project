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

  const trimmedName = normalizeValue(name);
  const profile = {
    uid: trimmedUid,
    name: trimmedName,
    fullName: trimmedName,
    email: normalizeValue(email),
    role: normalizedRole,
    createdAt: serverTimestamp(),
  };

  const trimmedPhone = normalizeValue(phoneNumber);
  if (trimmedPhone) {
    profile.phoneNumber = trimmedPhone;
    profile.phone = trimmedPhone;
  }

  const shouldIncludeCollege = ROLE_REQUIRES_COLLEGE.includes(normalizedRole);
  const trimmedCollegeId = normalizeValue(collegeId);
  if (shouldIncludeCollege) {
    if (!trimmedCollegeId) {
      throw new Error("collegeId is required for the selected role.");
    }
    profile.collegeId = trimmedCollegeId;
  }

  // Primary profile document — readable by admin via /users/{uid} rules.
  await setDoc(doc(db, "users", trimmedUid), profile, { merge: true });

  // Role-indexed copy under /users/roles/{collection}/{uid}.
  // This path is NOT covered by the security rules "match /users/{uid}",
  // so we keep writing it but also write to the top-level role collection
  // (e.g. /profs/{uid}) which has explicit admin-read rules.
  await setDoc(
    doc(db, "users", "roles", roleCollection, trimmedUid),
    profile,
    { merge: true }
  );
  // Top-level role collection (e.g. "profs", "assistants") — covered by rules.
  await setDoc(doc(db, roleCollection, trimmedUid), profile, { merge: true });

  return { uid: trimmedUid, ...profile };
};

export const getProfsByCollege = async ({ db, collegeId }) => {
  return getProfsByCollegeId(collegeId, db);
};

export const getProfsByCollegeId = async (collegeId, dbRef = appDb) => {
  if (!dbRef) throw new Error("db is required.");
  const trimmedCollegeId = normalizeValue(collegeId);
  if (!trimmedCollegeId) return [];

  // Query the top-level "profs" collection which has explicit admin-read rules
  // and receives a copy on every createUserProfile call.
  // Fall back to the "users" collection (also admin-readable) if needed.
  const [profsSnap, usersSnap] = await Promise.all([
    getDocs(
      query(
        collection(dbRef, "profs"),
        where("collegeId", "==", trimmedCollegeId)
      )
    ),
    getDocs(
      query(
        collection(dbRef, "users"),
        where("role", "==", "professor"),
        where("collegeId", "==", trimmedCollegeId)
      )
    ),
  ]);

  // Merge both result sets, deduplicated by uid/id.
  const seen = new Set();
  const results = [];
  for (const snap of [profsSnap, usersSnap]) {
    for (const docSnap of snap.docs) {
      const data = { id: docSnap.id, ...docSnap.data() };
      const key = data.uid || data.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        results.push(data);
      }
    }
  }
  return results;
};

export const getAssistantsByCollegeId = async (collegeId, dbRef = appDb) => {
  if (!dbRef) throw new Error("db is required.");
  const trimmedCollegeId = normalizeValue(collegeId);
  if (!trimmedCollegeId) return [];

  const [assistantsSnap, usersSnap] = await Promise.all([
    getDocs(
      query(
        collection(dbRef, "assistants"),
        where("collegeId", "==", trimmedCollegeId)
      )
    ),
    getDocs(
      query(
        collection(dbRef, "users"),
        where("role", "==", "assistant"),
        where("collegeId", "==", trimmedCollegeId)
      )
    ),
  ]);

  const seen = new Set();
  const results = [];
  for (const snap of [assistantsSnap, usersSnap]) {
    for (const docSnap of snap.docs) {
      const data = { id: docSnap.id, ...docSnap.data() };
      const key = data.uid || data.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        results.push(data);
      }
    }
  }
  return results;
};

export const getProfessorById = async ({ db, professorId } = {}) => {
  const dbRef = db || appDb;
  if (!dbRef) throw new Error("db is required.");
  const trimmedProfessorId = normalizeValue(professorId);
  if (!trimmedProfessorId) return null;

  if (professorCache.has(trimmedProfessorId)) {
    return professorCache.get(trimmedProfessorId);
  }

  // Try top-level "profs" collection first (has explicit security rules),
  // then fall back to "users" document.
  let snapshot = await getDoc(doc(dbRef, "profs", trimmedProfessorId));
  if (!snapshot.exists()) {
    snapshot = await getDoc(doc(dbRef, "users", trimmedProfessorId));
  }
  const data = snapshot.exists()
    ? { id: snapshot.id, ...snapshot.data() }
    : null;

  professorCache.set(trimmedProfessorId, data);
  return data;
};
