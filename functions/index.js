const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions");

admin.initializeApp();

exports.createUserWithRole = onCall({ cors: true }, async (request) => {
  // 1) Must be logged in
  if (!request.auth) {
    logger.error("Request failed: Unauthenticated");
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  // 2) Read caller role from custom claims
  const callerRole = request.auth.token.role;
  logger.info(`Caller UID: ${request.auth.uid}, Role: ${callerRole}`);

  // 3) Authorize caller (TEMPORARY: Ensure you have this role!)
  // If you are testing for the first time, you might want to log the role 
  // to make sure your account actually has "super_admin"
  if (callerRole !== "super_admin") {
    logger.warn(`Permission Denied for UID: ${request.auth.uid}`);
    throw new HttpsError("permission-denied", "Only Super Admins can create users.");
  }

  // 4) Validate input
  const { email, password, displayName, role } = request.data || {};
  if (!email || !password || !role) {
    throw new HttpsError("invalid-argument", "Missing email, password, or role.");
  }

  // Define allowed roles
  const validRoles = ["super_admin", "admin", "professor", "assistant", "student"];
  if (!validRoles.includes(role)) {
    throw new HttpsError("invalid-argument", "The specified role is not valid.");
  }

  try {
    // 5) Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || undefined,
    });

    // 6) Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    // 7) Create a Firestore profile doc
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      email,
      displayName: displayName || "",
      role,
      uid: userRecord.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Successfully created user: ${userRecord.uid} with role: ${role}`);
    return { ok: true, uid: userRecord.uid };

  } catch (error) {
    logger.error("Error creating user:", error);
    // Properly format the error for the frontend
    throw new HttpsError("internal", error.message);
  }
});