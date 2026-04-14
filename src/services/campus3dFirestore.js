import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const campusBuildingsCollection = () => collection(db, "campusBuildings");
const floorsCollection = (buildingId) =>
  collection(db, "campusBuildings", buildingId, "floors");
const roomsCollection = (buildingId, floorId) =>
  collection(db, "campusBuildings", buildingId, "floors", floorId, "rooms");

const mapSnapshot = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

export const listenBuildings = (onChange, onError) => {
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
      console.error("[campus3dFirestore] listenBuildings error", error);
      if (onError) onError(error);
    }
  );
};

export const listenFloors = (buildingId, onChange, onError) => {
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
      console.error("[campus3dFirestore] listenFloors error", error);
      if (onError) onError(error);
    }
  );
};

export const listenRooms = (buildingId, floorId, onChange, onError) => {
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
      console.error("[campus3dFirestore] listenRooms error", error);
      if (onError) onError(error);
    }
  );
};
