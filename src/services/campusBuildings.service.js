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
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const campusBuildingsCollection = () => collection(db, "campusBuildings");
const campusBuildingDoc = (buildingId) =>
  doc(db, "campusBuildings", buildingId);
const floorsCollection = (buildingId) =>
  collection(db, "campusBuildings", buildingId, "floors");
const floorDoc = (buildingId, floorId) =>
  doc(db, "campusBuildings", buildingId, "floors", floorId);
const roomsCollection = (buildingId, floorId) =>
  collection(db, "campusBuildings", buildingId, "floors", floorId, "rooms");
const roomDoc = (buildingId, floorId, roomId) =>
  doc(
    db,
    "campusBuildings",
    buildingId,
    "floors",
    floorId,
    "rooms",
    roomId
  );

const mapSnapshot = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

const logError = (context, error, meta = {}) => {
  console.error(`[campusBuildings.service] ${context}`, {
    ...meta,
    code: error?.code,
    message: error?.message,
  });
};

// Helper used by cascading deletes to keep batches under Firestore limits.
const deleteDocsInBatches = async (docs) => {
  const batchSize = 400;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = writeBatch(db);
    docs.slice(i, i + batchSize).forEach((snapshot) => {
      batch.delete(snapshot.ref);
    });
    await batch.commit();
  }
};

// Realtime listeners keep UI in sync without refresh.
export const subscribeBuildings = (onChange, onError) => {
  const buildingsQuery = query(
    campusBuildingsCollection(),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    buildingsQuery,
    (snapshot) => {
      if (onChange) onChange(snapshot.docs.map(mapSnapshot));
    },
    (error) => {
      logError("subscribeBuildings", error);
      if (onError) onError(error);
    }
  );
};

export const subscribeFloors = (buildingId, onChange, onError) => {
  if (!buildingId) return () => {};
  const floorsQuery = query(
    floorsCollection(buildingId),
    orderBy("floorNumber", "asc")
  );

  return onSnapshot(
    floorsQuery,
    (snapshot) => {
      if (onChange) onChange(snapshot.docs.map(mapSnapshot));
    },
    (error) => {
      logError("subscribeFloors", error, { buildingId });
      if (onError) onError(error);
    }
  );
};

export const subscribeRooms = (buildingId, floorId, onChange, onError) => {
  if (!buildingId || !floorId) return () => {};
  const roomsQuery = query(
    roomsCollection(buildingId, floorId),
    orderBy("roomNumber", "asc")
  );

  return onSnapshot(
    roomsQuery,
    (snapshot) => {
      if (onChange) onChange(snapshot.docs.map(mapSnapshot));
    },
    (error) => {
      logError("subscribeRooms", error, { buildingId, floorId });
      if (onError) onError(error);
    }
  );
};

export const createBuilding = async (payload) => {
  const data = {
    name: payload?.name?.trim() || "",
    code: payload?.code?.trim() || "",
    position3d: payload?.position3d ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(campusBuildingsCollection(), data);
  return { id: docRef.id, ...data };
};

export const updateBuilding = async (buildingId, payload) => {
  if (!buildingId) throw new Error("Building ID is required.");
  const data = {
    ...payload,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(campusBuildingDoc(buildingId), data);
  return { id: buildingId, ...data };
};

// Cascading delete: remove floors and rooms before removing the building.
export const deleteBuilding = async (buildingId) => {
  if (!buildingId) throw new Error("Building ID is required.");

  const floorsSnapshot = await getDocs(floorsCollection(buildingId));
  for (const floorSnapshot of floorsSnapshot.docs) {
    await deleteFloor(buildingId, floorSnapshot.id);
  }

  await deleteDoc(campusBuildingDoc(buildingId));
  return buildingId;
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

// Cascading delete: remove rooms before removing the floor.
export const deleteFloor = async (buildingId, floorId) => {
  if (!buildingId || !floorId) throw new Error("Floor details are required.");
  const roomsSnapshot = await getDocs(roomsCollection(buildingId, floorId));
  await deleteDocsInBatches(roomsSnapshot.docs);
  await deleteDoc(floorDoc(buildingId, floorId));
  return floorId;
};

export const createRoom = async (buildingId, floorId, payload) => {
  if (!buildingId || !floorId) throw new Error("Room details are required.");
  const data = {
    buildingId,
    campusBuildingId: buildingId,
    floorId,
    roomNumber: payload?.roomNumber?.trim() || "",
    name: payload?.name?.trim() || "",
    label: payload?.label?.trim() || "",
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
  await deleteDoc(roomDoc(buildingId, floorId, roomId));
  return roomId;
};

const demoRoomNumbers = (floorNumber) => {
  const base = floorNumber * 100;
  return Array.from({ length: 13 }, (_, index) => String(base + index + 1));
};

// Optional demo data helper for quick seeding.
export const generateDemoData = async (buildingId) => {
  if (!buildingId) throw new Error("Building ID is required.");

  const floorsSnapshot = await getDocs(floorsCollection(buildingId));
  const existingFloors = new Map();
  floorsSnapshot.docs.forEach((snapshot) => {
    const data = snapshot.data();
    const floorNumber = Number(data?.floorNumber);
    if (Number.isFinite(floorNumber)) {
      existingFloors.set(floorNumber, snapshot.id);
    }
  });

  let floorsCreated = 0;
  let roomsCreated = 0;

  for (const floorNumber of [1, 2, 3, 4]) {
    let floorId = existingFloors.get(floorNumber);
    if (!floorId) {
      const floorData = {
        buildingId,
        floorNumber,
        label: `Floor ${floorNumber}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const floorRef = await addDoc(floorsCollection(buildingId), floorData);
      floorId = floorRef.id;
      floorsCreated += 1;
    }

    if (!floorId) continue;

    const roomsSnapshot = await getDocs(roomsCollection(buildingId, floorId));
    const existingRooms = new Set(
      roomsSnapshot.docs.map((snapshot) =>
        String(snapshot.data()?.roomNumber || "").trim()
      )
    );

    const roomsCol = roomsCollection(buildingId, floorId);
    const batch = writeBatch(db);
    let batchCount = 0;

    demoRoomNumbers(floorNumber).forEach((roomNumber) => {
      if (existingRooms.has(roomNumber)) return;
      const roomRef = doc(roomsCol);
      batch.set(roomRef, {
        buildingId,
        campusBuildingId: buildingId,
        floorId,
        roomNumber,
        name: `Room ${roomNumber}`,
        label: "",
        capacity: 40,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batchCount += 1;
    });

    if (batchCount > 0) {
      await batch.commit();
      roomsCreated += batchCount;
    }
  }

  return { floorsCreated, roomsCreated };
};
