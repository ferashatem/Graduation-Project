const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions");

admin.initializeApp();

const validRoles = ["super_admin", "admin", "professor", "assistant", "student"];

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

exports.deleteUserAccount = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    logger.error("Delete request failed: Unauthenticated");
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const callerRole = request.auth.token.role;
  logger.info(`Delete request by UID: ${request.auth.uid}, Role: ${callerRole}`);

  if (callerRole !== "super_admin") {
    logger.warn(`Delete permission denied for UID: ${request.auth.uid}`);
    throw new HttpsError("permission-denied", "Only Super Admins can delete users.");
  }

  const { uid } = request.data || {};
  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "uid is required.");
  }

  try {
    await admin.auth().deleteUser(uid).catch((error) => {
      if (error?.code === "auth/user-not-found") {
        return null;
      }
      throw error;
    });

    await admin.firestore().collection("users").doc(uid).delete();

    logger.info(`Successfully deleted user: ${uid}`);
    return { ok: true, uid };
  } catch (error) {
    logger.error("Error deleting user:", error);
    throw new HttpsError("internal", error.message);
  }
});

exports.editUserAccount = onCall({ cors: true }, async (request) => {
  // 1) Must be logged in
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  // 2) Authorize caller
  const callerRole = request.auth.token.role;
  if (callerRole !== "super_admin") {
    throw new HttpsError("permission-denied", "Only Super Admins can edit users.");
  }

  // 3) Validate input
  const { uid, email, password, displayName, role } = request.data || {};
  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "uid is required.");
  }

  if (role && !validRoles.includes(role)) {
    throw new HttpsError("invalid-argument", "The specified role is not valid.");
  }

  try {
    // 4) Update Auth user (only fields provided)
    const authUpdate = {};
    if (email) authUpdate.email = String(email).trim();
    if (password) authUpdate.password = String(password).trim();
    if (displayName !== undefined) authUpdate.displayName = String(displayName);

    if (Object.keys(authUpdate).length > 0) {
      await admin.auth().updateUser(uid, authUpdate);
      // Admin SDK supports updating user properties (email, password, displayName, etc.)
      // without signing in as the user.
    } 

    // 5) Update role via custom claims (optional)
    if (role) {
      await admin.auth().setCustomUserClaims(uid, { role });
      // Custom claims should be set via Admin SDK in a privileged environment.
    } 

    // 6) Update Firestore profile (merge = partial update)
    const fsUpdate = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (email) fsUpdate.email = String(email).trim();
    if (displayName !== undefined) fsUpdate.displayName = String(displayName);
    if (role) fsUpdate.role = role;

    await admin.firestore().collection("users").doc(uid).set(fsUpdate, { merge: true });

    logger.info(`User updated: ${uid}`, { authUpdate, fsUpdate });
    return { ok: true, uid };
  } catch (error) {
    logger.error("Error editing user:", error);
    throw new HttpsError("internal", error?.message || "Failed to edit user.");
  }
});