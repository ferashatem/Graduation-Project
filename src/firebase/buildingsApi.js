import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import {
  buildingDoc,
  buildingsCollection,
  roomsCollection,
  scheduleCollection,
} from "./firestoreRefs";

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

const commitBatches = async (batches) => {
  for (const batch of batches) {
    await batch.commit();
  }
};

const createBatchQueue = () => {
  const batches = [];
  let currentBatch = writeBatch(db);
  let opCount = 0;

  const queueDelete = (ref) => {
    if (opCount >= 400) {
      batches.push(currentBatch);
      currentBatch = writeBatch(db);
      opCount = 0;
    }
    currentBatch.delete(ref);
    opCount += 1;
  };

  const flush = () => {
    if (opCount > 0) batches.push(currentBatch);
    return batches;
  };

  return { queueDelete, flush };
};

export const listBuildings = async (collegeId) => {
  if (!collegeId) return [];
  const buildingsQuery = query(buildingsCollection(collegeId), orderBy("name"));
  const snapshot = await getDocs(buildingsQuery);
  return snapshot.docs.map(mapDoc);
};

export const subscribeBuildings = (collegeId, onChange, onError) => {
  if (!collegeId) return () => {};
  const buildingsQuery = query(buildingsCollection(collegeId), orderBy("name"));
  return onSnapshot(
    buildingsQuery,
    (snapshot) => {
      if (onChange) onChange(snapshot.docs.map(mapDoc));
    },
    (error) => {
      console.error("[buildingsApi] subscribeBuildings error", {
        collegeId,
        code: error?.code,
        message: error?.message,
      });
      if (error?.code === "failed-precondition") {
        console.error(
          "[buildingsApi] subscribeBuildings index required:",
          error?.message
        );
      }
      if (onError) onError(error);
    }
  );
};

export const getBuilding = async (collegeId, buildingId) => {
  if (!collegeId || !buildingId) return null;
  const snapshot = await getDoc(buildingDoc(collegeId, buildingId));
  if (!snapshot.exists()) return null;
  return mapDoc(snapshot);
};

export const createBuilding = async (collegeId, payload) => {
  if (!collegeId) throw new Error("College ID is required.");
  const data = {
    name: payload?.name?.trim() || "",
    code: payload?.code?.trim() || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(buildingsCollection(collegeId), data);
  return { id: docRef.id, ...data };
};

export const updateBuilding = async (collegeId, buildingId, payload) => {
  if (!collegeId || !buildingId) throw new Error("Missing building details.");
  const data = {
    ...payload,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(buildingDoc(collegeId, buildingId), data);
  return { id: buildingId, ...data };
};

export const deleteBuilding = async (collegeId, buildingId) => {
  if (!collegeId || !buildingId) throw new Error("Missing building details.");

  const roomsSnapshot = await getDocs(roomsCollection(collegeId, buildingId));
  const { queueDelete, flush } = createBatchQueue();

  for (const roomSnap of roomsSnapshot.docs) {
    const schedulesSnapshot = await getDocs(
      scheduleCollection(collegeId, buildingId, roomSnap.id)
    );
    schedulesSnapshot.forEach((scheduleSnap) => {
      queueDelete(scheduleSnap.ref);
    });
    queueDelete(roomSnap.ref);
  }

  queueDelete(buildingDoc(collegeId, buildingId));
  const batches = flush();
  await commitBatches(batches);

  return buildingId;
};
