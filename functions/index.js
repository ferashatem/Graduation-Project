const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions");

admin.initializeApp();

const validRoles = ["super_admin", "admin", "professor", "assistant", "student"];

admin.initializeApp();

const normalizeRole = (role) => (role ? String(role).trim().toLowerCase() : "");

const getUserRole = async (uid) => {
  let role = "";

  try {
    const userRecord = await admin.auth().getUser(uid);
    role = normalizeRole(userRecord?.customClaims?.role);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }
  }

  if (!role) {
    const snapshot = await admin.firestore().collection("users").doc(uid).get();
    if (snapshot.exists) {
      role = normalizeRole(snapshot.data()?.role);
    }
  }

  return role;
};

exports.createUserWithRole = onCall({ cors: true }, async (request) => {
  // 1) Must be logged in
  if (!request.auth) {
    logger.error("Request failed: Unauthenticated");
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  // 2) Read caller role from custom claims
  const callerRole = normalizeRole(request.auth.token.role);
  logger.info(`Caller UID: ${request.auth.uid}, Role: ${callerRole}`);

  const isSuperAdmin = callerRole === "super_admin";
  const isAdmin = callerRole === "admin";

  // 3) Authorize caller
  if (!isSuperAdmin && !isAdmin) {
    logger.warn(`Permission Denied for UID: ${request.auth.uid}`);
    throw new HttpsError("permission-denied", "Only Super Admins or Admins can create users.");
  }

  // 4) Validate input
  const { email, password, displayName, role } = request.data || {};
  const normalizedRole = normalizeRole(role);
  if (!email || !password || !normalizedRole) {
    throw new HttpsError("invalid-argument", "Missing email, password, or role.");
  }

  // Define allowed roles
  if (!validRoles.includes(normalizedRole)) {
    throw new HttpsError("invalid-argument", "The specified role is not valid.");
  }
  if (isAdmin && normalizedRole === "super_admin") {
    throw new HttpsError("permission-denied", "Admins cannot create super admin accounts.");
  }

  try {
    // 5) Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || undefined,
    });

    // 6) Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: normalizedRole });

    // 7) Create a Firestore profile doc
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      email,
      displayName: displayName || "",
      role: normalizedRole,
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

  const callerRole = normalizeRole(request.auth.token.role);
  logger.info(`Delete request by UID: ${request.auth.uid}, Role: ${callerRole}`);

  const isSuperAdmin = callerRole === "super_admin";
  const isAdmin = callerRole === "admin";

  if (!isSuperAdmin && !isAdmin) {
    logger.warn(`Delete permission denied for UID: ${request.auth.uid}`);
    throw new HttpsError("permission-denied", "Only Super Admins or Admins can delete users.");
  }

  const { uid } = request.data || {};
  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "uid is required.");
  }

  try {
    const targetRole = await getUserRole(uid);
    if (isAdmin && targetRole === "super_admin") {
      throw new HttpsError("permission-denied", "Admins cannot delete super admin accounts.");
    }

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
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", error.message);
  }
});

exports.editUserAccount = onCall({ cors: true }, async (request) => {
  // 1) Must be logged in
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  // 2) Authorize caller
  const callerRole = normalizeRole(request.auth.token.role);
  const isSuperAdmin = callerRole === "super_admin";
  const isAdmin = callerRole === "admin";

  if (!isSuperAdmin && !isAdmin) {
    throw new HttpsError("permission-denied", "Only Super Admins or Admins can edit users.");
  }

  // 3) Validate input
  const { uid, email, password, displayName, role } = request.data || {};
  const normalizedRole = role ? normalizeRole(role) : "";
  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "uid is required.");
  }

  if (role && !validRoles.includes(normalizedRole)) {
    throw new HttpsError("invalid-argument", "The specified role is not valid.");
  }

  try {
    const targetRole = await getUserRole(uid);
    if (isAdmin && targetRole === "super_admin") {
      throw new HttpsError("permission-denied", "Admins cannot edit super admin accounts.");
    }
    if (isAdmin && normalizedRole === "super_admin") {
      throw new HttpsError("permission-denied", "Admins cannot assign the super admin role.");
    }

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
    if (normalizedRole) {
      await admin.auth().setCustomUserClaims(uid, { role: normalizedRole });
      // Custom claims should be set via Admin SDK in a privileged environment.
    } 

    // 6) Update Firestore profile (merge = partial update)
    const fsUpdate = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (email) fsUpdate.email = String(email).trim();
    if (displayName !== undefined) fsUpdate.displayName = String(displayName);
    if (normalizedRole) fsUpdate.role = normalizedRole;

    await admin.firestore().collection("users").doc(uid).set(fsUpdate, { merge: true });

    logger.info(`User updated: ${uid}`, { authUpdate, fsUpdate });
    return { ok: true, uid };
  } catch (error) {
    logger.error("Error editing user:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", error?.message || "Failed to edit user.");
  }
});
