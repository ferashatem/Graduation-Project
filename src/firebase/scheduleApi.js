import {
  collectionGroup,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { scheduleCollection, scheduleDoc } from "./firestoreRefs";

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

export const getScheduleDocId = (dayKey, slotKey) => `${dayKey}_${slotKey}`;

export const listSchedules = async (collegeId, buildingId, roomId, options = {}) => {
  if (!collegeId || !buildingId || !roomId) return [];
  const constraints = [];
  if (options.dayKey) constraints.push(where("dayKey", "==", options.dayKey));
  constraints.push(orderBy("startTime", "asc"));
  const schedulesQuery = query(
    scheduleCollection(collegeId, buildingId, roomId),
    ...constraints
  );
  const snapshot = await getDocs(schedulesQuery);
  return snapshot.docs.map(mapDoc);
};

export const subscribeSchedules = (
  collegeId,
  buildingId,
  roomId,
  options,
  onChange,
  onError
) => {
  if (!collegeId || !buildingId || !roomId) return () => {};
  const constraints = [];
  if (options?.dayKey) constraints.push(where("dayKey", "==", options.dayKey));
  constraints.push(orderBy("startTime", "asc"));
  const schedulesQuery = query(
    scheduleCollection(collegeId, buildingId, roomId),
    ...constraints
  );
  return onSnapshot(
    schedulesQuery,
    (snapshot) => {
      if (onChange) onChange(snapshot.docs.map(mapDoc));
    },
    (error) => {
      if (onError) onError(error);
    }
  );
};

export const subscribeSchedulesByBuildingDay = (
  collegeId,
  buildingId,
  dayKey,
  onChange,
  onError
) => {
  if (!collegeId || !buildingId || !dayKey) return () => {};
  const schedulesQuery = query(
    collectionGroup(db, "schedule"),
    where("collegeId", "==", collegeId),
    where("buildingId", "==", buildingId),
    where("dayKey", "==", dayKey)
  );
  return onSnapshot(
    schedulesQuery,
    (snapshot) => {
      const schedules = snapshot.docs.map(mapDoc);
      schedules.sort((a, b) =>
        String(a.slotKey || "").localeCompare(String(b.slotKey || ""))
      );
      if (onChange) onChange(schedules);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
};

export const getSchedule = async (collegeId, buildingId, roomId, scheduleId) => {
  if (!collegeId || !buildingId || !roomId || !scheduleId) return null;
  const snapshot = await getDoc(scheduleDoc(collegeId, buildingId, roomId, scheduleId));
  if (!snapshot.exists()) return null;
  return mapDoc(snapshot);
};

export const createSchedule = async (collegeId, buildingId, roomId, payload) => {
  if (!collegeId || !buildingId || !roomId)
    throw new Error("Missing schedule details.");
  const scheduleId = getScheduleDocId(payload.dayKey, payload.slotKey);
  const scheduleRef = scheduleDoc(collegeId, buildingId, roomId, scheduleId);

  const data = {
    dayKey: payload.dayKey,
    slotKey: payload.slotKey,
    startTime: payload.startTime,
    endTime: payload.endTime,
    courseId: payload.courseId || "",
    courseName: payload.courseName || "",
    courseCode: payload.courseCode || "",
    instructorId: payload.instructorId || "",
    instructorName: payload.instructorName || "",
    section: payload.section || "",
    collegeId,
    buildingId,
    roomId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(scheduleRef);
    if (existing.exists()) {
      throw new Error("Slot already booked");
    }
    transaction.set(scheduleRef, data);
  });

  return { id: scheduleId, ...data };
};

export const updateSchedule = async (
  collegeId,
  buildingId,
  roomId,
  scheduleId,
  payload
) => {
  if (!collegeId || !buildingId || !roomId || !scheduleId)
    throw new Error("Missing schedule details.");
  const data = {
    ...payload,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(scheduleDoc(collegeId, buildingId, roomId, scheduleId), data);
  return { id: scheduleId, ...data };
};

export const deleteSchedule = async (collegeId, buildingId, roomId, scheduleId) => {
  if (!collegeId || !buildingId || !roomId || !scheduleId)
    throw new Error("Missing schedule details.");
  await deleteDoc(scheduleDoc(collegeId, buildingId, roomId, scheduleId));
  return scheduleId;
};
