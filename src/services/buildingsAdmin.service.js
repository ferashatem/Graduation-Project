import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const buildingsCollection = () => collection(db, "buildings");
const buildingDoc = (buildingId) => doc(db, "buildings", buildingId);
const floorsCollection = (buildingId) =>
  collection(db, "buildings", buildingId, "floors");
const floorDoc = (buildingId, floorId) =>
  doc(db, "buildings", buildingId, "floors", floorId);
const roomsCollection = (buildingId, floorId) =>
  collection(db, "buildings", buildingId, "floors", floorId, "rooms");
const roomDoc = (buildingId, floorId, roomId) =>
  doc(db, "buildings", buildingId, "floors", floorId, "rooms", roomId);
const scheduleCollection = (buildingId, floorId, roomId) =>
  collection(
    db,
    "buildings",
    buildingId,
    "floors",
    floorId,
    "rooms",
    roomId,
    "schedule"
  );
const scheduleDoc = (buildingId, floorId, roomId, sessionId) =>
  doc(
    db,
    "buildings",
    buildingId,
    "floors",
    floorId,
    "rooms",
    roomId,
    "schedule",
    sessionId
  );

const mapSnapshot = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

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

export const getBuildings = async () => {
  const buildingsQuery = query(buildingsCollection(), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(buildingsQuery);
  return snapshot.docs.map(mapSnapshot);
};

export const fetchColleges = async () => {
  const collegesQuery = query(collection(db, "colleges"), orderBy("name", "asc"));
  const snapshot = await getDocs(collegesQuery);
  return snapshot.docs.map(mapSnapshot);
};

export const fetchMaterialsByCollege = async (collegeId) => {
  if (!collegeId) return [];
  const subcollectionRef = collection(db, "colleges", collegeId, "materials");
  try {
    const subQuery = query(subcollectionRef, orderBy("title", "asc"));
    const subSnapshot = await getDocs(subQuery);
    const subMaterials = subSnapshot.docs.map(mapSnapshot);
    if (subMaterials.length > 0) return subMaterials;
  } catch (error) {
    // fall through to top-level materials fallback
  }

  const topLevelRef = collection(db, "materials");
  const topQuery = query(
    topLevelRef,
    where("collegeId", "==", collegeId),
    orderBy("title", "asc")
  );
  const topSnapshot = await getDocs(topQuery);
  return topSnapshot.docs.map(mapSnapshot);
};

export const getBuildingById = async (buildingId) => {
  if (!buildingId) return null;
  const snapshot = await getDoc(buildingDoc(buildingId));
  if (!snapshot.exists()) return null;
  return mapSnapshot(snapshot);
};

export const createBuilding = async (payload) => {
  const data = {
    name: payload?.name?.trim() || "",
    code: payload?.code?.trim() || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(buildingsCollection(), data);
  return { id: docRef.id, ...data };
};

export const updateBuilding = async (buildingId, payload) => {
  if (!buildingId) throw new Error("Building ID is required.");
  const data = {
    ...payload,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(buildingDoc(buildingId), data);
  return { id: buildingId, ...data };
};

export const deleteBuilding = async (buildingId) => {
  if (!buildingId) throw new Error("Building ID is required.");

  const floorsSnapshot = await getDocs(floorsCollection(buildingId));
  const { queueDelete, flush } = createBatchQueue();

  for (const floorSnap of floorsSnapshot.docs) {
    const roomsSnapshot = await getDocs(
      roomsCollection(buildingId, floorSnap.id)
    );
    for (const roomSnap of roomsSnapshot.docs) {
      const schedulesSnapshot = await getDocs(
        scheduleCollection(buildingId, floorSnap.id, roomSnap.id)
      );
      schedulesSnapshot.forEach((sessionSnap) => {
        queueDelete(sessionSnap.ref);
      });
      queueDelete(roomSnap.ref);
    }
    queueDelete(floorSnap.ref);
  }

  queueDelete(buildingDoc(buildingId));
  await commitBatches(flush());
  return buildingId;
};

export const getFloors = async (buildingId) => {
  if (!buildingId) return [];
  const floorsQuery = query(
    floorsCollection(buildingId),
    orderBy("floorNumber", "asc")
  );
  const snapshot = await getDocs(floorsQuery);
  return snapshot.docs.map(mapSnapshot);
};

export const getFloorById = async (buildingId, floorId) => {
  if (!buildingId || !floorId) return null;
  const snapshot = await getDoc(floorDoc(buildingId, floorId));
  if (!snapshot.exists()) return null;
  return mapSnapshot(snapshot);
};

export const createFloor = async (buildingId, payload) => {
  if (!buildingId) throw new Error("Building ID is required.");
  const data = {
    buildingId,
    floorNumber: Number(payload?.floorNumber),
    label: payload?.label?.trim() || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(floorsCollection(buildingId), data);
  return { id: docRef.id, ...data };
};

export const updateFloor = async (buildingId, floorId, payload) => {
  if (!buildingId || !floorId) throw new Error("Floor details are required.");
  const data = {
    ...payload,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(floorDoc(buildingId, floorId), data);
  return { id: floorId, ...data };
};

export const deleteFloor = async (buildingId, floorId) => {
  if (!buildingId || !floorId) throw new Error("Floor details are required.");
  const roomsSnapshot = await getDocs(roomsCollection(buildingId, floorId));
  const { queueDelete, flush } = createBatchQueue();

  for (const roomSnap of roomsSnapshot.docs) {
    const schedulesSnapshot = await getDocs(
      scheduleCollection(buildingId, floorId, roomSnap.id)
    );
    schedulesSnapshot.forEach((sessionSnap) => {
      queueDelete(sessionSnap.ref);
    });
    queueDelete(roomSnap.ref);
  }

  queueDelete(floorDoc(buildingId, floorId));
  await commitBatches(flush());
  return floorId;
};

export const getRooms = async (buildingId, floorId) => {
  if (!buildingId || !floorId) return [];
  const roomsQuery = query(
    roomsCollection(buildingId, floorId),
    orderBy("roomNumber", "asc")
  );
  const snapshot = await getDocs(roomsQuery);
  return snapshot.docs.map(mapSnapshot);
};

export const getRoom = async (buildingId, floorId, roomId) => {
  if (!buildingId || !floorId || !roomId) return null;
  const snapshot = await getDoc(roomDoc(buildingId, floorId, roomId));
  if (!snapshot.exists()) return null;
  return mapSnapshot(snapshot);
};

export const createRoom = async (buildingId, floorId, payload) => {
  if (!buildingId || !floorId) throw new Error("Room details are required.");
  const data = {
    buildingId,
    floorId,
    roomNumber: payload?.roomNumber?.trim() || "",
    name: payload?.name?.trim() || "",
    label: payload?.label?.trim() || "",
    type: payload?.type?.trim() || "",
    capacity:
      payload?.capacity === "" || payload?.capacity === null
        ? null
        : Number(payload?.capacity),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(roomsCollection(buildingId, floorId), data);
  return { id: docRef.id, ...data };
};

export const updateRoom = async (buildingId, floorId, roomId, payload) => {
  if (!buildingId || !floorId || !roomId)
    throw new Error("Room details are required.");
  const data = {
    ...payload,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(roomDoc(buildingId, floorId, roomId), data);
  return { id: roomId, ...data };
};

export const deleteRoom = async (buildingId, floorId, roomId) => {
  if (!buildingId || !floorId || !roomId)
    throw new Error("Room details are required.");
  const schedulesSnapshot = await getDocs(
    scheduleCollection(buildingId, floorId, roomId)
  );
  const { queueDelete, flush } = createBatchQueue();
  schedulesSnapshot.forEach((sessionSnap) => {
    queueDelete(sessionSnap.ref);
  });
  queueDelete(roomDoc(buildingId, floorId, roomId));
  await commitBatches(flush());
  return roomId;
};

export const getRoomScheduleByDay = async (buildingId, floorId, roomId, day) => {
  if (!buildingId || !floorId || !roomId || !day) return [];
  const schedulesQuery = query(
    scheduleCollection(buildingId, floorId, roomId),
    where("day", "==", day)
  );
  const snapshot = await getDocs(schedulesQuery);
  return snapshot.docs.map(mapSnapshot);
};

export const addRoomSession = async (buildingId, floorId, roomId, payload) => {
  if (!buildingId || !floorId || !roomId)
    throw new Error("Missing schedule details.");
  const data = {
    day: payload?.day || "",
    startTime: payload?.startTime || "",
    endTime: payload?.endTime || "",
    collegeId: payload?.collegeId || "",
    collegeName: payload?.collegeName || "",
    materialId: payload?.materialId || "",
    materialTitle: payload?.materialTitle || "",
    notes: payload?.notes || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(scheduleCollection(buildingId, floorId, roomId), data);
  return { id: docRef.id, ...data };
};

export const updateRoomSession = async (
  buildingId,
  floorId,
  roomId,
  sessionId,
  payload
) => {
  if (!buildingId || !floorId || !roomId || !sessionId)
    throw new Error("Missing schedule details.");
  const data = {
    ...payload,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(scheduleDoc(buildingId, floorId, roomId, sessionId), data);
  return { id: sessionId, ...data };
};

export const deleteRoomSession = async (
  buildingId,
  floorId,
  roomId,
  sessionId
) => {
  if (!buildingId || !floorId || !roomId || !sessionId)
    throw new Error("Missing schedule details.");
  await deleteDoc(scheduleDoc(buildingId, floorId, roomId, sessionId));
  return sessionId;
};
