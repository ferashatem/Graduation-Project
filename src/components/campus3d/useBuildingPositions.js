import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { latLngToWorld } from "../../services/buildingCoordinates.service";
import { getErrorMessage } from "../../utils/errorHelpers";

const campusBuildingsCollection = () => collection(db, "campusBuildings");

const normalizeCode = (value) => String(value || "").trim().toUpperCase();

const extractLatLng = (positionGeo) => {
  if (!positionGeo) return null;
  if (typeof positionGeo.latitude === "number") {
    return { lat: positionGeo.latitude, lng: positionGeo.longitude };
  }
  if (
    typeof positionGeo.lat === "number" &&
    typeof positionGeo.lng === "number"
  ) {
    return { lat: positionGeo.lat, lng: positionGeo.lng };
  }
  return null;
};

function useBuildingPositions() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const buildingsQuery = query(
      campusBuildingsCollection(),
      orderBy("code", "asc")
    );

    const unsubscribe = onSnapshot(
      buildingsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setBuildings(data);
        setError("");
        setLoading(false);
      },
      (err) => {
        console.error("[useBuildingPositions] listen error", err);
        setError(getErrorMessage(err));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const origin = useMemo(() => {
    const byCode = buildings.find(
      (building) => normalizeCode(building?.code) === "A"
    );
    const originLatLng = extractLatLng(byCode?.positionGeo);
    if (originLatLng) {
      return { ...originLatLng, code: "A" };
    }

    const fallback = buildings.find((building) =>
      extractLatLng(building?.positionGeo)
    );
    const fallbackLatLng = extractLatLng(fallback?.positionGeo);
    if (fallbackLatLng) {
      return { ...fallbackLatLng, code: normalizeCode(fallback?.code) };
    }
    return null;
  }, [buildings]);

  useEffect(() => {
    if (!buildings.length) return;
    const hasOrigin = buildings.some(
      (building) =>
        normalizeCode(building?.code) === "A" &&
        Boolean(extractLatLng(building?.positionGeo))
    );
    if (!hasOrigin) {
      console.warn(
        "[useBuildingPositions] Origin building A is missing positionGeo. Falling back to first available building."
      );
    }
  }, [buildings]);

  const buildingsWithWorld = useMemo(() => {
    if (!origin) {
      return buildings.map((building) => ({
        ...building,
        worldPosition: null,
      }));
    }

    return buildings.map((building) => {
      const coords = extractLatLng(building?.positionGeo);
      if (!coords) {
        return { ...building, worldPosition: null };
      }
      const world = latLngToWorld(
        coords.lat,
        coords.lng,
        origin.lat,
        origin.lng
      );
      return { ...building, worldPosition: world };
    });
  }, [buildings, origin]);

  const positionsByCode = useMemo(() => {
    const map = new Map();
    buildingsWithWorld.forEach((building) => {
      const code = normalizeCode(building?.code);
      if (code && building?.worldPosition) {
        map.set(code, building.worldPosition);
      }
    });
    return map;
  }, [buildingsWithWorld]);

  return {
    buildings: buildingsWithWorld,
    positionsByCode,
    origin,
    loading,
    error,
  };
}

export default useBuildingPositions;
