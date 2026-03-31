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

// ─── Schedules ───────────────────────────────────────────────────────────────

const schedulesCol = (buildingId, floorId, roomId) =>
  collection(db, COL, buildingId, "floors", floorId, "rooms", roomId, "schedules");

const scheduleDocRef = (buildingId, floorId, roomId, scheduleId) =>
  doc(db, COL, buildingId, "floors", floorId, "rooms", roomId, "schedules", scheduleId);

export const minutesToTime = (minutes) => {
  const total = Number(minutes);
  if (!Number.isFinite(total)) return "";
  const clamped = Math.min(Math.max(Math.floor(total), 0), 1439);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const getCampusRoomSchedulesByDay = async (buildingId, floorId, roomId, day) => {
  if (!buildingId || !floorId || !roomId || !day) return [];
  const q = query(schedulesCol(buildingId, floorId, roomId), where("day", "==", day));
  const snap = await getDocs(q);
  return snap.docs.map(mapDoc).sort((a, b) => (a.startMin || 0) - (b.startMin || 0));
};

export const getCampusRoomAllSchedules = async (buildingId, floorId, roomId) => {
  if (!buildingId || !floorId || !roomId) return [];
  const q = query(schedulesCol(buildingId, floorId, roomId), orderBy("day", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(mapDoc);
};

export const getFloorSchedulesByDay = async (buildingId, floorId, roomIds, day) => {
  if (!buildingId || !floorId || !day || !roomIds?.length) return {};
  const map = {};
  await Promise.all(
    roomIds.map(async (rid) => {
      map[rid] = await getCampusRoomSchedulesByDay(buildingId, floorId, rid, day);
    })
  );
  return map;
};

export const addCampusSchedule = async (buildingId, floorId, roomId, payload) => {
  if (!buildingId || !floorId || !roomId) throw new Error("Schedule details required.");
  const data = {
    buildingId,
    floorId,
    roomId,
    day: payload?.day || "",
    startMin: Number(payload?.startMin),
    endMin: Number(payload?.endMin),
    courseId: payload?.courseId || "",
    courseName: payload?.courseName || "",
    slots: Array.isArray(payload?.slots) ? payload.slots : [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(schedulesCol(buildingId, floorId, roomId), data);
  return { id: ref.id, ...data };
};

export const updateCampusSchedule = async (buildingId, floorId, roomId, scheduleId, payload) => {
  if (!buildingId || !floorId || !roomId || !scheduleId)
    throw new Error("Schedule details required.");
  const data = {
    day: payload?.day || "",
    startMin: Number(payload?.startMin),
    endMin: Number(payload?.endMin),
    courseId: payload?.courseId || "",
    courseName: payload?.courseName || "",
    slots: Array.isArray(payload?.slots) ? payload.slots : [],
    updatedAt: serverTimestamp(),
  };
  await updateDoc(scheduleDocRef(buildingId, floorId, roomId, scheduleId), data);
  return { id: scheduleId, ...data };
};

export const deleteCampusSchedule = async (buildingId, floorId, roomId, scheduleId) => {
  if (!buildingId || !floorId || !roomId || !scheduleId)
    throw new Error("Schedule details required.");
  await deleteDoc(scheduleDocRef(buildingId, floorId, roomId, scheduleId));
  return scheduleId;
};
