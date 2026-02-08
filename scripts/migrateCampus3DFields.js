/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const args = process.argv.slice(2);
const dryRun =
  args.includes("--dryRun") ||
  args.includes("--dry-run") ||
  process.env.DRY_RUN === "true";

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!admin.apps.length) {
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(
      fs.readFileSync(path.resolve(serviceAccountPath), "utf8")
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    admin.initializeApp();
  }
}

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const CONFIG = {
  spacing: 20,
  size3d: { width: 12, depth: 12, heightPerFloor: 3 },
  floorsCount: 4,
  roomsPerFloor: 13,
  room: {
    columns: 4,
    cellSize: 2.6,
    gap: 0.3,
    size3d: { width: 2.6, depth: 2.6, height: 1 },
  },
};

const BUILDING_GRID = {
  A: { row: 0, col: 0 },
  B: { row: 0, col: 1 },
  C: { row: 0, col: 2 },
  D: { row: 0, col: 3 },
  E: { row: 1, col: 0 },
  F: { row: 1, col: 1 },
  G: { row: 1, col: 2 },
  H: { row: 1, col: 3 },
};

const isNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

const isVector3 = (value) =>
  value &&
  isNumber(value.x) &&
  isNumber(value.y) &&
  isNumber(value.z);

const isBuildingSize3d = (value) =>
  value &&
  isNumber(value.width) &&
  isNumber(value.depth) &&
  isNumber(value.heightPerFloor);

const isRoomSize3d = (value) =>
  value && isNumber(value.width) && isNumber(value.depth) && isNumber(value.height);

const normalizeCode = (value) => String(value || "").trim().toUpperCase();

const computeBuildingPosition = (code, fallbackIndex) => {
  const normalized = normalizeCode(code);
  const grid = BUILDING_GRID[normalized];
  if (grid) {
    return {
      x: grid.col * CONFIG.spacing,
      y: 0,
      z: grid.row * CONFIG.spacing,
    };
  }
  const col = fallbackIndex % 4;
  const row = Math.floor(fallbackIndex / 4);
  return {
    x: col * CONFIG.spacing,
    y: 0,
    z: row * CONFIG.spacing,
  };
};

const computeGridPos = (index) => {
  const col = index % CONFIG.room.columns;
  const row = Math.floor(index / CONFIG.room.columns);
  return { col, row };
};

const computeRoomLocalPosition = (gridPos, heightOffset) => {
  const step = CONFIG.room.cellSize + CONFIG.room.gap;
  const x = (gridPos.col - 1.5) * step;
  const z = (gridPos.row - 1.5) * step;
  const y = heightOffset + 0.5;
  return { x, y, z };
};

const MAX_BATCH = 450;
let batch = db.batch();
let batchOps = 0;

const commitBatch = async () => {
  if (batchOps === 0) return;
  if (dryRun) {
    console.log(`[dryRun] would commit ${batchOps} writes`);
    batch = db.batch();
    batchOps = 0;
    return;
  }
  await batch.commit();
  batch = db.batch();
  batchOps = 0;
};

const queueUpdate = async (ref, data, label) => {
  if (!data || Object.keys(data).length === 0) return false;
  if (dryRun) {
    console.log(`[dryRun] update ${label}: ${ref.path}`, data);
    return true;
  }
  batch.set(ref, data, { merge: true });
  batchOps += 1;
  if (batchOps >= MAX_BATCH) {
    await commitBatch();
  }
  return true;
};

const run = async () => {
  console.log(
    `Starting campus 3D migration (dryRun=${dryRun ? "true" : "false"})`
  );

  const buildingSnap = await db.collection("campusBuildings").get();
  const buildings = buildingSnap.docs;
  let buildingsUpdated = 0;
  let floorsUpdated = 0;
  let roomsUpdated = 0;

  for (let i = 0; i < buildings.length; i += 1) {
    const buildingDoc = buildings[i];
    const buildingData = buildingDoc.data() || {};
    const buildingCode = normalizeCode(buildingData.code);

    console.log(
      `[migrate] Building ${buildingCode || buildingDoc.id} (${buildingDoc.id})`
    );

    const buildingUpdate = {};
    if (!isVector3(buildingData.position3d)) {
      buildingUpdate.position3d = computeBuildingPosition(buildingCode, i);
    }
    if (!isBuildingSize3d(buildingData.size3d)) {
      buildingUpdate.size3d = { ...CONFIG.size3d };
    }
    if (!isNumber(buildingData.floorsCount)) {
      buildingUpdate.floorsCount = CONFIG.floorsCount;
    }
    if (!isNumber(buildingData.roomsPerFloor)) {
      buildingUpdate.roomsPerFloor = CONFIG.roomsPerFloor;
    }
    if (Object.keys(buildingUpdate).length > 0) {
      buildingUpdate.updatedAt = FieldValue.serverTimestamp();
      const didUpdate = await queueUpdate(
        buildingDoc.ref,
        buildingUpdate,
        "building"
      );
      if (didUpdate) buildingsUpdated += 1;
    }

    const heightPerFloor = isBuildingSize3d(buildingData.size3d)
      ? buildingData.size3d.heightPerFloor
      : CONFIG.size3d.heightPerFloor;

    const floorsSnap = await buildingDoc.ref.collection("floors").get();
    const floors = floorsSnap.docs;
    for (const floorDoc of floors) {
      const floorData = floorDoc.data() || {};
      const floorNumber = isNumber(floorData.floorNumber)
        ? Number(floorData.floorNumber)
        : 1;
      const heightOffset = (floorNumber - 1) * heightPerFloor;
      const floorUpdate = {};

      if (!isNumber(floorData.floorNumber)) {
        floorUpdate.floorNumber = floorNumber;
      }
      if (!isNumber(floorData.heightOffset) || floorData.heightOffset !== heightOffset) {
        floorUpdate.heightOffset = heightOffset;
      }
      if (!floorData.label || String(floorData.label).trim() === "") {
        floorUpdate.label = `Floor ${floorNumber}`;
      }
      if (!floorData.buildingId || floorData.buildingId !== buildingDoc.id) {
        floorUpdate.buildingId = buildingDoc.id;
      }
      if (Object.keys(floorUpdate).length > 0) {
        floorUpdate.updatedAt = FieldValue.serverTimestamp();
        const didUpdate = await queueUpdate(
          floorDoc.ref,
          floorUpdate,
          "floor"
        );
        if (didUpdate) floorsUpdated += 1;
      }

      const roomsSnap = await floorDoc.ref.collection("rooms").get();
      const rooms = roomsSnap.docs.sort((a, b) =>
        String(a.data()?.roomNumber || "").localeCompare(
          String(b.data()?.roomNumber || "")
        )
      );
      for (let index = 0; index < rooms.length; index += 1) {
        const roomDoc = rooms[index];
        const roomData = roomDoc.data() || {};
        const roomNumber = String(roomData.roomNumber || "").trim();
        const roomUpdate = {};

        if (!roomData.buildingId || roomData.buildingId !== buildingDoc.id) {
          roomUpdate.buildingId = buildingDoc.id;
        }
        if (!roomData.floorId || roomData.floorId !== floorDoc.id) {
          roomUpdate.floorId = floorDoc.id;
        }
        if (!roomData.label || String(roomData.label).trim() === "") {
          roomUpdate.label = roomNumber || roomData.name || "Room";
        }
        if (Object.prototype.hasOwnProperty.call(roomData, "campusBuildingId")) {
          roomUpdate.campusBuildingId = FieldValue.delete();
        }

        const gridPos =
          roomData.gridPos &&
          isNumber(roomData.gridPos.col) &&
          isNumber(roomData.gridPos.row)
            ? roomData.gridPos
            : computeGridPos(index);
        if (
          !roomData.gridPos ||
          !isNumber(roomData.gridPos.col) ||
          !isNumber(roomData.gridPos.row)
        ) {
          roomUpdate.gridPos = gridPos;
        }

        const localPosition3d =
          roomData.localPosition3d &&
          isVector3(roomData.localPosition3d)
            ? roomData.localPosition3d
            : computeRoomLocalPosition(gridPos, heightOffset);
        if (!isVector3(roomData.localPosition3d)) {
          roomUpdate.localPosition3d = localPosition3d;
        }

        if (!isRoomSize3d(roomData.size3d)) {
          roomUpdate.size3d = { ...CONFIG.room.size3d };
        }

        if (Object.keys(roomUpdate).length > 0) {
          roomUpdate.updatedAt = FieldValue.serverTimestamp();
          const didUpdate = await queueUpdate(
            roomDoc.ref,
            roomUpdate,
            "room"
          );
          if (didUpdate) roomsUpdated += 1;
        }
      }
    }
  }

  await commitBatch();

  console.log("Migration complete.");
  console.log(
    JSON.stringify(
      {
        buildingsUpdated,
        floorsUpdated,
        roomsUpdated,
        dryRun,
      },
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});
