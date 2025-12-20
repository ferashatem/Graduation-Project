const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Callable function:
 * - Only a "super_admin" (or admin) can assign roles
 * - Sets custom claim: { role: "student" | "admin" | ... }
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // 1) Must be logged in
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login required.");
  }

  // 2) Must be authorized (change logic to match your project)
  const callerClaims = context.auth.token;
  const isSuperAdmin = callerClaims.role === "super_admin";
  if (!isSuperAdmin) {
    throw new functions.https.HttpsError("permission-denied", "Not allowed.");
  }

  // 3) Validate input
  const { uid, role } = data;
  const allowedRoles = ["super_admin", "admin", "professor", "assistant", "student"];

  if (!uid || typeof uid !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "uid is required.");
  }
  if (!allowedRoles.includes(role)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid role.");
  }

  // 4) Set the claim
  await admin.auth().setCustomUserClaims(uid, { role });

  return { ok: true, uid, role };
});
