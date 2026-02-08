export const extractLatLng = (positionGeo) => {
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

export const latLngToWorld = (lat, lng, originLat, originLng) => {
  const metersPerDegLat = 110540;
  const metersPerDegLng =
    111320 * Math.cos((originLat * Math.PI) / 180);
  const x = (lng - originLng) * metersPerDegLng;
  const z = (lat - originLat) * metersPerDegLat;
  return { x, z };
};
