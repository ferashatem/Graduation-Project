import {
  addDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import {
  buildingDoc,
  buildingsCollection,
  roomDoc,
  roomsCollection,
  scheduleCollection,
  scheduleDoc,
} from "./firestoreRefs";
import { buildSlotKeyFromTimes } from "../utils/campusScheduleUtils";
import { deleteBuilding as deleteBuildingCascade } from "./buildingsApi";
import { deleteRoom as deleteRoomCascade } from "./roomsApi";

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

export const listenBuildings = (collegeId, onChange, onError) => {
  if (!collegeId) return () => {};
  const buildingsQuery = query(buildingsCollection(collegeId), orderBy("name"));
  return onSnapshot(
    buildingsQuery,
    (snapshot) => {
      if (onChange) onChange(snapshot.docs.map(mapDoc));
    },
    (error) => {
      console.error("[firestoreCampusApi] listenBuildings error", {
        collegeId,
        code: error?.code,
        message: error?.message,
      });
      if (onError) onError(error);
    }
  );
};

export const listenRooms = (collegeId, buildingId, onChange, onError) => {
  if (!collegeId || !buildingId) return () => {};
  const roomsQuery = query(roomsCollection(collegeId, buildingId), orderBy("name"));
  return onSnapshot(
    roomsQuery,
    (snapshot) => {
      if (onChange) onChange(snapshot.docs.map(mapDoc));
    },
    (error) => {
      console.error("[firestoreCampusApi] listenRooms error", {
        collegeId,
        buildingId,
        code: error?.code,
        message: error?.message,
      });
      if (onError) onError(error);
    }
  );
};

export const fetchOrListenRoomSchedule = (
  collegeId,
  buildingId,
  roomId,
  options = {}
) => {
  const { listen = true, onChange, onError } = options;
  if (!collegeId || !buildingId || !roomId) {
    return listen ? () => {} : Promise.resolve([]);
  }

  const scheduleRef = scheduleCollection(collegeId, buildingId, roomId);

  if (!listen) {
    return getDocs(scheduleRef).then((snapshot) => snapshot.docs.map(mapDoc));
  }

  return onSnapshot(
    scheduleRef,
    (snapshot) => {
      if (onChange) onChange(snapshot.docs.map(mapDoc));
    },
    (error) => {
      console.error("[firestoreCampusApi] listenRoomSchedule error", {
        collegeId,
        buildingId,
        roomId,
        code: error?.code,
        message: error?.message,
      });
      if (onError) onError(error);
    }
  );
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
  return deleteBuildingCascade(collegeId, buildingId);
};

export const createRoom = async (collegeId, buildingId, payload) => {
  if (!collegeId || !buildingId) throw new Error("Missing room details.");
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
  return deleteRoomCascade(collegeId, buildingId, roomId);
};

export const reserveSlot = async ({
  collegeId,
  buildingId,
  roomId,
  day,
  start,
  end,
  courseId,
  courseName,
  section,
}) => {
  const dayKey = String(day || "").trim().toLowerCase();
  const slotKey = buildSlotKeyFromTimes(start, end);
  if (!collegeId || !buildingId || !roomId || !dayKey || !slotKey) {
    throw new Error("Missing schedule details.");
  }

  const scheduleId = `${dayKey}_${slotKey}`;
  const scheduleRef = scheduleDoc(collegeId, buildingId, roomId, scheduleId);

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(scheduleRef);
    if (existing.exists()) {
      const data = existing.data() || {};
      if (String(data.status || "").toLowerCase() !== "available") {
        const error = new Error("Slot already booked");
        error.code = "slot-already-booked";
        throw error;
      }
    }

    const payload = {
      day: dayKey,
      start: start || "",
      end: end || "",
      status: "reserved",
      dayKey,
      slotKey,
      startTime: start || "",
      endTime: end || "",
      courseId: courseId || "",
      courseName: courseName || "",
      section: section || "",
      collegeId,
      buildingId,
      roomId,
      updatedAt: serverTimestamp(),
    };

    if (!existing.exists()) {
      payload.createdAt = serverTimestamp();
    }

    transaction.set(scheduleRef, payload, { merge: true });
  });

  return { id: scheduleId };
};

export const unreserveSlot = async ({
  collegeId,
  buildingId,
  roomId,
  day,
  start,
  end,
}) => {
  const dayKey = String(day || "").trim().toLowerCase();
  const slotKey = buildSlotKeyFromTimes(start, end);
  if (!collegeId || !buildingId || !roomId || !dayKey || !slotKey) {
    throw new Error("Missing schedule details.");
  }
  const scheduleId = `${dayKey}_${slotKey}`;
  await deleteDoc(scheduleDoc(collegeId, buildingId, roomId, scheduleId));
  return scheduleId;
};
