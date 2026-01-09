import {
  addDoc,
  collectionGroup,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  where,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { roomDoc, roomsCollection, scheduleCollection } from "./firestoreRefs";

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

export const listRooms = async (collegeId, buildingId) => {
  if (!collegeId || !buildingId) return [];
  const roomsQuery = query(roomsCollection(collegeId, buildingId), orderBy("name"));
  const snapshot = await getDocs(roomsQuery);
  return snapshot.docs.map(mapDoc);
};

export const subscribeRooms = (collegeId, buildingId, onChange, onError) => {
  if (!collegeId || !buildingId) return () => {};
  const roomsQuery = query(roomsCollection(collegeId, buildingId), orderBy("name"));
  return onSnapshot(
    roomsQuery,
    (snapshot) => {
      if (onChange) onChange(snapshot.docs.map(mapDoc));
    },
    (error) => {
      if (onError) onError(error);
    }
  );
};

export const subscribeRoomsByCollege = (collegeId, onChange, onError) => {
  if (!collegeId) return () => {};
  const roomsQuery = query(
    collectionGroup(db, "rooms"),
    where("collegeId", "==", collegeId)
  );
  return onSnapshot(
    roomsQuery,
    (snapshot) => {
      const rooms = snapshot.docs.map(mapDoc);
      rooms.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
      if (onChange) onChange(rooms);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
};

export const getRoom = async (collegeId, buildingId, roomId) => {
  if (!collegeId || !buildingId || !roomId) return null;
  const snapshot = await getDoc(roomDoc(collegeId, buildingId, roomId));
  if (!snapshot.exists()) return null;
  return mapDoc(snapshot);
};

export const createRoom = async (collegeId, buildingId, payload) => {
  if (!collegeId || !buildingId) throw new Error("Missing building details.");
  const data = {
    name: payload?.name?.trim() || "",
    capacity:
      payload?.capacity === "" || payload?.capacity === null
        ? null
        : Number(payload?.capacity),
    floor: payload?.floor?.trim() || "",
    collegeId,
    buildingId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(roomsCollection(collegeId, buildingId), data);
  return { id: docRef.id, ...data };
};

export const updateRoom = async (collegeId, buildingId, roomId, payload) => {
  if (!collegeId || !buildingId || !roomId)
    throw new Error("Missing room details.");
  const data = {
    ...payload,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(roomDoc(collegeId, buildingId, roomId), data);
  return { id: roomId, ...data };
};

export const deleteRoom = async (collegeId, buildingId, roomId) => {
  if (!collegeId || !buildingId || !roomId)
    throw new Error("Missing room details.");

  const schedulesSnapshot = await getDocs(
    scheduleCollection(collegeId, buildingId, roomId)
  );
  const { queueDelete, flush } = createBatchQueue();

  schedulesSnapshot.forEach((scheduleSnap) => {
    queueDelete(scheduleSnap.ref);
  });

  queueDelete(roomDoc(collegeId, buildingId, roomId));
  const batches = flush();
  await commitBatches(batches);

  return roomId;
};

