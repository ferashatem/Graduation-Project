import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const COURSE_ASSIGNMENTS_COLLECTION = "courseAssignments";

const getTimestampValue = (timestamp) => {
  if (!timestamp) return 0;
  if (typeof timestamp.toDate === "function") return timestamp.toDate().getTime();
  if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000;
  if (timestamp instanceof Date) return timestamp.getTime();
  const numeric = Number(timestamp);
  return Number.isNaN(numeric) ? 0 : numeric;
};

export const normalizeAssignment = (snapshot) => {
  const data = snapshot.data() || {};
  return {
    id: snapshot.id,
    ...data,
  };
};

export const getProfessorProfile = async (uid) => {
  if (!uid) return null;
  const profileSnap = await getDoc(doc(db, "users", uid));
  if (!profileSnap.exists()) return null;
  return {
    id: profileSnap.id,
    ...profileSnap.data(),
  };
};

export const listenProfessorAssignments = (
  uid,
  options = {},
  onChange,
  onError
) => {
  if (!uid) return () => {};

  const constraints = [where("professorIds", "array-contains", uid)];
  if (options?.termId) {
    constraints.push(where("termId", "==", options.termId));
  }

  const baseRef = collection(db, COURSE_ASSIGNMENTS_COLLECTION);

  let unsubscribe = () => {};
  let didFallback = false;

  const subscribe = (withOrder) => {
    const assignmentsQuery = withOrder
      ? query(baseRef, ...constraints, orderBy("createdAt", "desc"))
      : query(baseRef, ...constraints);

    unsubscribe = onSnapshot(
      assignmentsQuery,
      (snapshot) => {
        const assignments = snapshot.docs.map(normalizeAssignment);
        if (!withOrder) {
          assignments.sort(
            (a, b) => getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt)
          );
        }
        if (onChange) onChange(assignments);
      },
      (error) => {
        if (!didFallback && withOrder && error?.code === "failed-precondition") {
          didFallback = true;
          unsubscribe();
          if (onError) onError(error, { fallback: true, reason: "missing-index" });
          subscribe(false);
          return;
        }
        if (onError) onError(error, { fallback: false });
      }
    );
  };

  subscribe(true);

  return () => unsubscribe();
};
