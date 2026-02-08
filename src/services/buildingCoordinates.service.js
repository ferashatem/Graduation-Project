import {
  GeoPoint,
  collection,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const BUILDING_COORDINATES = {
  A: { lat: 29.033788549571295, lng: 31.121131863691954 },
  B: { lat: 29.03300361085053, lng: 31.12171485278328 },
  C: { lat: 29.03336388571045, lng: 31.12229117958634 },
  D: { lat: 29.03380519177664, lng: 31.122812923734916 },
  E: { lat: 29.034758020518407, lng: 31.122821090762656 },
  F: { lat: 29.035138809112922, lng: 31.1224509973125 },
  G: { lat: 29.034915565681516, lng: 31.121144438204546 },
  H: { lat: 29.034568091762438, lng: 31.12056245363234 },
};

const campusBuildingsCollection = () => collection(db, "campusBuildings");

const normalizeCode = (value) => String(value || "").trim().toUpperCase();

// Converts latitude/longitude to local meters for Three.js world coords.
export const latLngToWorld = (lat, lng, originLat, originLng) => {
  const metersPerDegLat = 110540;
  const metersPerDegLng =
    111320 * Math.cos((originLat * Math.PI) / 180);

  const x = (lng - originLng) * metersPerDegLng;
  const z = (lat - originLat) * metersPerDegLat;

  return { x, z };
};

// One-time sync to write GeoPoint coordinates into campusBuildings by code.
export const syncBuildingCoordinates = async () => {
  const results = {
    updated: 0,
    missing: [],
    duplicates: [],
  };

  for (const [code, coords] of Object.entries(BUILDING_COORDINATES)) {
    const q = query(
      campusBuildingsCollection(),
      where("code", "==", normalizeCode(code))
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn(
        `[syncBuildingCoordinates] No campus building found for code ${code}.`
      );
      results.missing.push(code);
      continue;
    }

    if (snapshot.docs.length > 1) {
      console.warn(
        `[syncBuildingCoordinates] Multiple buildings found for code ${code}. Updating all matches.`
      );
      results.duplicates.push(code);
    }

    const positionGeo = new GeoPoint(coords.lat, coords.lng);
    const payload = {
      positionGeo,
      updatedAt: serverTimestamp(),
    };

    for (const docSnap of snapshot.docs) {
      await updateDoc(docSnap.ref, payload);
      results.updated += 1;
    }
  }

  return results;
};
