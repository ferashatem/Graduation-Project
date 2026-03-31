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
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const COL = "campusBuildings";

const mapDoc = (snap) => ({ id: snap.id, ...snap.data() });

// ─── Buildings ────────────────────────────────────────────────────────────────

export const getCampusBuildings = async () => {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(mapDoc);
};

export const getCampusBuildingById = async (buildingId) => {
  if (!buildingId) return null;
  const snap = await getDoc(doc(db, COL, buildingId));
  return snap.exists() ? mapDoc(snap) : null;
};

export const createCampusBuilding = async (payload) => {
  const data = {
    name: payload?.name?.trim() || "",
    code: payload?.code?.trim() || "",
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COL), data);
  return { id: ref.id, ...data };
};

export const updateCampusBuilding = async (buildingId, payload) => {
  if (!buildingId) throw new Error("Building ID required.");
  await updateDoc(doc(db, COL, buildingId), {
    name: payload?.name?.trim() || "",
    code: payload?.code?.trim() || "",
  });
};

export const deleteCampusBuilding = async (buildingId) => {
  if (!buildingId) throw new Error("Building ID required.");
  const batch = writeBatch(db);

  const floorsSnap = await getDocs(collection(db, COL, buildingId, "floors"));
  for (const floorDoc of floorsSnap.docs) {
    const roomsSnap = await getDocs(
      collection(db, COL, buildingId, "floors", floorDoc.id, "rooms")
    );
    for (const roomDoc of roomsSnap.docs) {
      batch.delete(roomDoc.ref);
    }
    batch.delete(floorDoc.ref);
  }
  batch.delete(doc(db, COL, buildingId));
  await batch.commit();
};

// ─── Floors ───────────────────────────────────────────────────────────────────

export const getCampusFloors = async (buildingId) => {
  if (!buildingId) return [];
  const q = query(
    collection(db, COL, buildingId, "floors"),
    orderBy("floorNumber", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapDoc);
};

export const createCampusFloor = async (buildingId, payload) => {
  if (!buildingId) throw new Error("Building ID required.");
  const data = {
    floorNumber: Number(payload?.floorNumber),
    label: payload?.label?.trim() || "",
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COL, buildingId, "floors"), data);
  return { id: ref.id, ...data };
};

export const updateCampusFloor = async (buildingId, floorId, payload) => {
  if (!buildingId || !floorId) throw new Error("Building and floor IDs required.");
  await updateDoc(doc(db, COL, buildingId, "floors", floorId), {
    floorNumber: Number(payload?.floorNumber),
    label: payload?.label?.trim() || "",
  });
};

export const deleteCampusFloor = async (buildingId, floorId) => {
  if (!buildingId || !floorId) throw new Error("Building and floor IDs required.");
  const batch = writeBatch(db);

  const roomsSnap = await getDocs(
    collection(db, COL, buildingId, "floors", floorId, "rooms")
  );
  for (const roomDoc of roomsSnap.docs) {
    batch.delete(roomDoc.ref);
  }
  batch.delete(doc(db, COL, buildingId, "floors", floorId));
  await batch.commit();
};

// ─── Rooms ────────────────────────────────────────────────────────────────────

export const getCampusRooms = async (buildingId, floorId) => {
  if (!buildingId || !floorId) return [];
  const q = query(
    collection(db, COL, buildingId, "floors", floorId, "rooms"),
    orderBy("roomNumber", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapDoc);
};

export const createCampusRoom = async (buildingId, floorId, payload) => {
  if (!buildingId || !floorId) throw new Error("Building and floor IDs required.");
  const data = {
    roomNumber: payload?.roomNumber?.trim() || "",
    floorNumber: Number(payload?.floorNumber) || 0,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(
    collection(db, COL, buildingId, "floors", floorId, "rooms"),
    data
  );
  return { id: ref.id, ...data };
};

export const updateCampusRoom = async (buildingId, floorId, roomId, payload) => {
  if (!buildingId || !floorId || !roomId)
    throw new Error("Building, floor, and room IDs required.");
  await updateDoc(
    doc(db, COL, buildingId, "floors", floorId, "rooms", roomId),
    { roomNumber: payload?.roomNumber?.trim() || "" }
  );
};

export const deleteCampusRoom = async (buildingId, floorId, roomId) => {
  if (!buildingId || !floorId || !roomId)
    throw new Error("Building, floor, and room IDs required.");
  await deleteDoc(
    doc(db, COL, buildingId, "floors", floorId, "rooms", roomId)
  );
};
