import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
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
const schedulesCollection = (buildingId, floorId, roomId) =>
  collection(
    db,
    "campusBuildings",
    buildingId,
    "floors",
    floorId,
    "rooms",
    roomId,
    "schedules"
  );
const scheduleDoc = (buildingId, floorId, roomId, scheduleId) =>
  doc(
    db,
    "campusBuildings",
    buildingId,
    "floors",
    floorId,
    "rooms",
    roomId,
    "schedules",
    scheduleId
  );
const roomSchedulesCollection = () => collection(db, "roomSchedules");
const roomScheduleDoc = (scheduleId) => doc(db, "roomSchedules", scheduleId);

const mapSnapshot = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

const BUILDING_DEFAULTS = {
  size3d: { width: 12, heightPerFloor: 3, depth: 12 },
  floorsCount: 4,
  roomsPerFloor: 13,
};

const ROOM_LAYOUT = {
  columns: 4,
  cellSize: 2.6,
  gap: 0.3,
  size3d: { width: 2.6, height: 1, depth: 2.6 },
};

const isNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

export const minutesToTime = (minutes) => {
  const total = Number(minutes);
  if (!Number.isFinite(total)) return "";
  const clamped = Math.min(Math.max(Math.floor(total), 0), 1439);
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const timeToMinutes = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return Number.NaN;
  const [hoursPart, minutesPart] = raw.split(":");
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return Number.NaN;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59)
    return Number.NaN;
  return hours * 60 + minutes;
};

export const generateSlots = (day, startMin, endMin, step = 30) => {
  const dayKey = String(day || "").trim().toUpperCase();
  if (!dayKey) return [];
  const start = Number(startMin);
  const end = Number(endMin);
  const safeStep = Number(step) > 0 ? Number(step) : 30;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end)
    return [];
  const slots = [];
  for (let cursor = start; cursor < end; cursor += safeStep) {
    const timeKey = minutesToTime(cursor).replace(":", "");
    slots.push(`${dayKey}_${timeKey}`);
  }
  return slots;
};

export const isOverlapping = (aStart, aEnd, bStart, bEnd) => {
  const aStartNum = Number(aStart);
  const aEndNum = Number(aEnd);
  const bStartNum = Number(bStart);
  const bEndNum = Number(bEnd);
  if (
    !Number.isFinite(aStartNum) ||
    !Number.isFinite(aEndNum) ||
    !Number.isFinite(bStartNum) ||
    !Number.isFinite(bEndNum)
  )
    return false;
  return aStartNum < bEndNum && aEndNum > bStartNum;
};

const normalizePosition3d = (position) => {
  if (
    position &&
    isNumber(position.x) &&
    isNumber(position.y) &&
    isNumber(position.z)
  ) {
    return position;
  }
  return { x: 0, y: 0, z: 0 };
};

const normalizeSize3d = (size3d) => {
  if (
    size3d &&
    isNumber(size3d.width) &&
    isNumber(size3d.depth) &&
    isNumber(size3d.heightPerFloor)
  ) {
    return size3d;
  }
  return { ...BUILDING_DEFAULTS.size3d };
};

const buildRoomGrid = (index) => {
  const col = index % ROOM_LAYOUT.columns;
  const row = Math.floor(index / ROOM_LAYOUT.columns);
  return { col, row };
};

const buildRoomLocalPosition = (gridPos, heightOffset = 0) => {
  if (!gridPos) return { x: 0, y: heightOffset + 0.5, z: 0 };
  const step = ROOM_LAYOUT.cellSize + ROOM_LAYOUT.gap;
  const x = (gridPos.col - 1.5) * step;
  const z = (gridPos.row - 1.5) * step;
  return { x, y: heightOffset + 0.5, z };
};

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
  const resolveRef = (docOrRef) => (docOrRef?.ref ? docOrRef.ref : docOrRef);
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = writeBatch(db);
    docs.slice(i, i + batchSize).forEach((entry) => {
      const ref = resolveRef(entry);
      if (ref) batch.delete(ref);
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

export const getBuildings = async () => {
  const buildingsQuery = query(
    campusBuildingsCollection(),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(buildingsQuery);
  return snapshot.docs.map(mapSnapshot);
};

export const getBuildingById = async (buildingId) => {
  if (!buildingId) return null;
  const snapshot = await getDoc(campusBuildingDoc(buildingId));
  if (!snapshot.exists()) return null;
  return mapSnapshot(snapshot);
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

export const getRooms = async (buildingId, floorId) => {
  if (!buildingId || !floorId) return [];
  const roomsQuery = query(
    roomsCollection(buildingId, floorId),
    orderBy("roomNumber", "asc")
  );
  const snapshot = await getDocs(roomsQuery);
  return snapshot.docs.map(mapSnapshot);
};

export const getRoomSchedule = async (buildingId, floorId, roomId) => {
  return listSchedules(buildingId, floorId, roomId);
};

export const createBuilding = async (payload) => {
  const size3d = normalizeSize3d(payload?.size3d);
  const position3d = normalizePosition3d(payload?.position3d);
  const data = {
    name: payload?.name?.trim() || "",
    code: payload?.code?.trim() || "",
    position3d,
    size3d,
    floorsCount: isNumber(payload?.floorsCount)
      ? payload.floorsCount
      : BUILDING_DEFAULTS.floorsCount,
    roomsPerFloor: isNumber(payload?.roomsPerFloor)
      ? payload.roomsPerFloor
      : BUILDING_DEFAULTS.roomsPerFloor,
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
  const floorNumber = Number(payload?.floorNumber);
  const heightPerFloor = isNumber(payload?.heightPerFloor)
    ? payload.heightPerFloor
    : BUILDING_DEFAULTS.size3d.heightPerFloor;
  const heightOffset = isNumber(payload?.heightOffset)
    ? payload.heightOffset
    : (floorNumber - 1) * heightPerFloor;
  const data = {
    buildingId,
    floorNumber,
    label: payload?.label?.trim() || "",
    heightOffset,
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
  for (const roomSnapshot of roomsSnapshot.docs) {
    await deleteRoom(buildingId, floorId, roomSnapshot.id);
  }
  await deleteDoc(floorDoc(buildingId, floorId));
  return floorId;
};

export const createRoom = async (buildingId, floorId, payload) => {
  if (!buildingId || !floorId) throw new Error("Room details are required.");
  const roomNumber = payload?.roomNumber?.trim() || "";
  const label = payload?.label?.trim() || roomNumber;
  const gridIndex = isNumber(payload?.gridIndex) ? payload.gridIndex : 0;
  const gridPos =
    payload?.gridPos && isNumber(payload.gridPos.col) && isNumber(payload.gridPos.row)
      ? payload.gridPos
      : buildRoomGrid(gridIndex);
  const heightOffset = isNumber(payload?.heightOffset) ? payload.heightOffset : 0;
  const localPosition3d =
    payload?.localPosition3d &&
    isNumber(payload.localPosition3d.x) &&
    isNumber(payload.localPosition3d.y) &&
    isNumber(payload.localPosition3d.z)
      ? payload.localPosition3d
      : buildRoomLocalPosition(gridPos, heightOffset);
  const size3d =
    payload?.size3d &&
    isNumber(payload.size3d.width) &&
    isNumber(payload.size3d.height) &&
    isNumber(payload.size3d.depth)
      ? payload.size3d
      : { ...ROOM_LAYOUT.size3d };
  const data = {
    buildingId,
    floorId,
    roomNumber,
    name: payload?.name?.trim() || "",
    label,
    gridPos,
    localPosition3d,
    size3d,
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
    schedulesCollection(buildingId, floorId, roomId)
  );
  const deleteTargets = [];
  schedulesSnapshot.docs.forEach((scheduleSnap) => {
    deleteTargets.push(scheduleSnap);
    deleteTargets.push(roomScheduleDoc(scheduleSnap.id));
  });
  deleteTargets.push(roomDoc(buildingId, floorId, roomId));
  await deleteDocsInBatches(deleteTargets);
  return roomId;
};

export const listSchedules = async (buildingId, floorId, roomId) => {
  if (!buildingId || !floorId || !roomId) return [];
  const schedulesQuery = query(
    schedulesCollection(buildingId, floorId, roomId),
    orderBy("day", "asc"),
    orderBy("startMin", "asc")
  );
  const snapshot = await getDocs(schedulesQuery);
  return snapshot.docs.map(mapSnapshot);
};

export const upsertRoomScheduleMirror = async (scheduleId, payload, writer) => {
  if (!scheduleId) throw new Error("Schedule ID is required.");
  const data = {
    ...payload,
    updatedAt: serverTimestamp(),
  };
  if (payload?.createdAt) {
    data.createdAt = payload.createdAt;
  }
  const ref = roomScheduleDoc(scheduleId);
  if (writer?.set) {
    writer.set(ref, data, { merge: true });
    return { id: scheduleId, ...data };
  }
  await setDoc(ref, data, { merge: true });
  return { id: scheduleId, ...data };
};

export const deleteRoomScheduleMirror = async (scheduleId, writer) => {
  if (!scheduleId) throw new Error("Schedule ID is required.");
  const ref = roomScheduleDoc(scheduleId);
  if (writer?.delete) {
    writer.delete(ref);
    return scheduleId;
  }
  await deleteDoc(ref);
  return scheduleId;
};

const resolveSchedulePayload = (payload) => ({
  day: String(payload?.day || "").trim().toUpperCase(),
  startMin: Number(payload?.startMin),
  endMin: Number(payload?.endMin),
  courseId: payload?.courseId ? String(payload.courseId).trim() : "",
  courseName: payload?.courseName ? String(payload.courseName).trim() : "",
  slots: Array.isArray(payload?.slots) ? payload.slots : [],
});

const ensureNoOverlap = ({ schedules = [], startMin, endMin, day, ignoreId }) => {
  const conflict = schedules.find((schedule) => {
    if (ignoreId && schedule.id === ignoreId) return false;
    return (
      String(schedule.day || "").toUpperCase() ===
        String(day || "").toUpperCase() &&
      isOverlapping(startMin, endMin, schedule.startMin, schedule.endMin)
    );
  });
  if (conflict) {
    const conflictStart = minutesToTime(conflict.startMin);
    const conflictEnd = minutesToTime(conflict.endMin);
    const message = `This room is already booked on ${
      conflict.day || day
    } from ${conflictStart} to ${conflictEnd}`;
    const error = new Error(message);
    error.code = "room-overlap";
    throw error;
  }
};

// Syncs a room schedule entry into all courseAssignment documents for the given course.
// Pass entry=null to remove the schedule entry (e.g. on delete).
const syncScheduleToCourseAssignments = async (courseId, scheduleId, entry) => {
  if (!courseId || !scheduleId) return;
  const q = query(
    collection(db, "courseAssignments"),
    where("courseId", "==", courseId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const writes = snap.docs.map(async (docSnap) => {
    const current = Array.isArray(docSnap.data().schedule) ? docSnap.data().schedule : [];
    const filtered = current.filter((s) => s.scheduleId !== scheduleId);
    const updated = entry ? [...filtered, { scheduleId, ...entry }] : filtered;
    await updateDoc(docSnap.ref, { schedule: updated });
  });
  await Promise.all(writes);
};

// Schedule CRUD keeps room-level schedules and the roomSchedules mirror in sync.
export const addSchedule = async (buildingId, floorId, roomId, payload) => {
  if (!buildingId || !floorId || !roomId)
    throw new Error("Schedule details are required.");
  const scheduleRef = doc(schedulesCollection(buildingId, floorId, roomId));
  const scheduleId = scheduleRef.id;
  const resolved = resolveSchedulePayload(payload);
  if (!resolved.day) throw new Error("Day is required.");
  if (!Number.isFinite(resolved.startMin) || !Number.isFinite(resolved.endMin)) {
    throw new Error("Start and end times are required.");
  }
  if (resolved.startMin >= resolved.endMin)
    throw new Error("Start time must be before end time.");

  const schedulesQuery = query(
    schedulesCollection(buildingId, floorId, roomId),
    where("day", "==", resolved.day)
  );

  const scheduleData = {
    buildingId,
    floorId,
    roomId,
    day: resolved.day,
    startMin: resolved.startMin,
    endMin: resolved.endMin,
    courseId: resolved.courseId || null,
    courseName: resolved.courseName || "",
    slots: resolved.slots,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const mirrorData = {
    buildingId,
    floorId,
    roomId,
    day: resolved.day,
    startMin: resolved.startMin,
    endMin: resolved.endMin,
    courseId: resolved.courseId || null,
    courseName: resolved.courseName || "",
    slots: resolved.slots,
    createdAt: serverTimestamp(),
  };

  await runTransaction(db, async (transaction) => {
    const existingSnapshot = await getDocs(schedulesQuery);
    const existingSchedules = existingSnapshot.docs.map(mapSnapshot);
    ensureNoOverlap({
      schedules: existingSchedules,
      startMin: resolved.startMin,
      endMin: resolved.endMin,
      day: resolved.day,
    });
    transaction.set(scheduleRef, scheduleData);
    await upsertRoomScheduleMirror(scheduleId, mirrorData, transaction);
  });

  if (resolved.courseId) {
    await syncScheduleToCourseAssignments(resolved.courseId, scheduleId, {
      day: resolved.day,
      startTime: minutesToTime(resolved.startMin),
      endTime: minutesToTime(resolved.endMin),
    });
  }

  return { id: scheduleId, ...scheduleData };
};

export const updateSchedule = async (
  buildingId,
  floorId,
  roomId,
  scheduleId,
  payload
) => {
  if (!buildingId || !floorId || !roomId || !scheduleId)
    throw new Error("Schedule details are required.");
  const resolved = resolveSchedulePayload(payload);
  if (!resolved.day) throw new Error("Day is required.");
  if (!Number.isFinite(resolved.startMin) || !Number.isFinite(resolved.endMin)) {
    throw new Error("Start and end times are required.");
  }
  if (resolved.startMin >= resolved.endMin)
    throw new Error("Start time must be before end time.");

  const schedulesQuery = query(
    schedulesCollection(buildingId, floorId, roomId),
    where("day", "==", resolved.day)
  );

  const scheduleRef = scheduleDoc(buildingId, floorId, roomId, scheduleId);

  // Read the existing doc so we can clean up old courseAssignment links if courseId changed.
  const existingSnap = await getDoc(scheduleRef);
  const oldCourseId = existingSnap.exists() ? (existingSnap.data().courseId || null) : null;

  const scheduleData = {
    day: resolved.day,
    startMin: resolved.startMin,
    endMin: resolved.endMin,
    courseId: resolved.courseId || null,
    courseName: resolved.courseName || "",
    slots: resolved.slots,
    updatedAt: serverTimestamp(),
  };
  const mirrorData = {
    buildingId,
    floorId,
    roomId,
    day: resolved.day,
    startMin: resolved.startMin,
    endMin: resolved.endMin,
    courseId: resolved.courseId || null,
    courseName: resolved.courseName || "",
    slots: resolved.slots,
  };

  await runTransaction(db, async (transaction) => {
    const existingSnapshot = await getDocs(schedulesQuery);
    const existingSchedules = existingSnapshot.docs.map(mapSnapshot);
    ensureNoOverlap({
      schedules: existingSchedules,
      startMin: resolved.startMin,
      endMin: resolved.endMin,
      day: resolved.day,
      ignoreId: scheduleId,
    });
    transaction.update(scheduleRef, scheduleData);
    await upsertRoomScheduleMirror(scheduleId, mirrorData, transaction);
  });

  // If the courseId changed, remove the schedule entry from the old course's assignments.
  if (oldCourseId && oldCourseId !== resolved.courseId) {
    await syncScheduleToCourseAssignments(oldCourseId, scheduleId, null);
  }
  if (resolved.courseId) {
    await syncScheduleToCourseAssignments(resolved.courseId, scheduleId, {
      day: resolved.day,
      startTime: minutesToTime(resolved.startMin),
      endTime: minutesToTime(resolved.endMin),
    });
  }

  return { id: scheduleId, ...scheduleData };
};

export const deleteSchedule = async (buildingId, floorId, roomId, scheduleId) => {
  if (!buildingId || !floorId || !roomId || !scheduleId)
    throw new Error("Schedule details are required.");

  // Read the schedule to know which courseId to clean up.
  const scheduleRef = scheduleDoc(buildingId, floorId, roomId, scheduleId);
  const existingSnap = await getDoc(scheduleRef);
  const courseId = existingSnap.exists() ? (existingSnap.data().courseId || null) : null;

  const batch = writeBatch(db);
  batch.delete(scheduleRef);
  await deleteRoomScheduleMirror(scheduleId, batch);
  await batch.commit();

  if (courseId) {
    await syncScheduleToCourseAssignments(courseId, scheduleId, null);
  }

  return scheduleId;
};

export const listOccupiedRoomIds = async (buildingId, floorId, slots) => {
  if (!buildingId || !floorId || !Array.isArray(slots) || slots.length === 0)
    return [];
  const schedulesQuery = query(
    roomSchedulesCollection(),
    where("buildingId", "==", buildingId),
    where("floorId", "==", floorId),
    where("slots", "array-contains-any", slots)
  );
  const snapshot = await getDocs(schedulesQuery);
  const roomIds = new Set();
  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data() || {};
    if (data.roomId) roomIds.add(data.roomId);
  });
  return Array.from(roomIds);
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
        heightOffset: (floorNumber - 1) * BUILDING_DEFAULTS.size3d.heightPerFloor,
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

    demoRoomNumbers(floorNumber).forEach((roomNumber, index) => {
      if (existingRooms.has(roomNumber)) return;
      const roomRef = doc(roomsCol);
      const gridPos = buildRoomGrid(index);
      const heightOffset =
        (floorNumber - 1) * BUILDING_DEFAULTS.size3d.heightPerFloor;
      batch.set(roomRef, {
        buildingId,
        floorId,
        roomNumber,
        name: `Room ${roomNumber}`,
        label: roomNumber,
        capacity: 40,
        gridPos,
        localPosition3d: buildRoomLocalPosition(gridPos, heightOffset),
        size3d: { ...ROOM_LAYOUT.size3d },
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
