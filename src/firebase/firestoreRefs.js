import { collection, doc } from "firebase/firestore";
import { db } from "./firebaseConfig";

const COLLECTIONS = {
  colleges: "colleges",
  buildings: "buildings",
  rooms: "rooms",
  schedule: "schedule",
};

export const collegesCollection = () => collection(db, COLLECTIONS.colleges);
export const collegeDoc = (collegeId) => doc(db, COLLECTIONS.colleges, collegeId);

export const buildingsCollection = (collegeId) =>
  collection(db, COLLECTIONS.colleges, collegeId, COLLECTIONS.buildings);
export const buildingDoc = (collegeId, buildingId) =>
  doc(db, COLLECTIONS.colleges, collegeId, COLLECTIONS.buildings, buildingId);

export const roomsCollection = (collegeId, buildingId) =>
  collection(
    db,
    COLLECTIONS.colleges,
    collegeId,
    COLLECTIONS.buildings,
    buildingId,
    COLLECTIONS.rooms
  );
export const roomDoc = (collegeId, buildingId, roomId) =>
  doc(
    db,
    COLLECTIONS.colleges,
    collegeId,
    COLLECTIONS.buildings,
    buildingId,
    COLLECTIONS.rooms,
    roomId
  );

export const scheduleCollection = (collegeId, buildingId, roomId) =>
  collection(
    db,
    COLLECTIONS.colleges,
    collegeId,
    COLLECTIONS.buildings,
    buildingId,
    COLLECTIONS.rooms,
    roomId,
    COLLECTIONS.schedule
  );
export const scheduleDoc = (collegeId, buildingId, roomId, scheduleId) =>
  doc(
    db,
    COLLECTIONS.colleges,
    collegeId,
    COLLECTIONS.buildings,
    buildingId,
    COLLECTIONS.rooms,
    roomId,
    COLLECTIONS.schedule,
    scheduleId
  );

