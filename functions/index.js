/*
Cloud Functions callable user management with role-based access controls.
Admins are limited to professor/assistant/student to prevent privilege escalation.
Client-side before calling: await auth.currentUser.getIdToken(true);
*/
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const VALID_ROLES = ["super_admin", "admin", "professor", "assistant", "student"];
const ADMIN_ALLOWED_ROLES = ["professor", "assistant", "student"];

const normalizeRole = (role) => (role ? String(role).trim().toLowerCase() : "");

const assertAuthenticated = (request) => {
  if (!request.auth) {
    logger.warn("Unauthenticated callable request.");
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }
};

const getCallerRole = (request) => normalizeRole(request.auth.token.role);

const logPermissionDenied = (request, callerRole, reason) => {
  logger.warn(
    `Permission denied: Caller UID ${request.auth?.uid || "unknown"} Role ${
      callerRole || "none"
    } ${reason}`
  );
};

const assertCallerIsAdminOrSuperAdmin = (request, callerRole, action) => {
  if (callerRole === "super_admin" || callerRole === "admin") {
    return;
  }
  logPermissionDenied(request, callerRole, `Action ${action}`);
  throw new HttpsError(
    "permission-denied",
    `Only Super Admins or Admins can ${action} users.`
  );
};

const assertAdminAllowedRole = (request, callerRole, role, action) => {
  if (callerRole !== "admin") {
    return;
  }
  if (ADMIN_ALLOWED_ROLES.includes(role)) {
    return;
  }
  logPermissionDenied(
    request,
    callerRole,
    `Action ${action} Role ${role || "unknown"}`
  );
  throw new HttpsError(
    "permission-denied",
    "Admins can only manage professor, assistant, or student accounts."
  );
};

const getTargetRole = async (uid) => {
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

const throwAsHttpsError = (error) => {
  if (error instanceof HttpsError) {
    throw error;
  }
  const code = String(error?.code || "");
  if (code.startsWith("auth/")) {
    throw new HttpsError("invalid-argument", error.message || "Invalid request.");
  }
  throw new HttpsError("invalid-argument", error?.message || "Invalid request.");
};

exports.createUserWithRole = onCall({ cors: true }, async (request) => {
  assertAuthenticated(request);

  const callerRole = getCallerRole(request);
  logger.info(
    `Caller UID ${request.auth.uid} Role ${callerRole} Action createUserWithRole`
  );

  assertCallerIsAdminOrSuperAdmin(request, callerRole, "create");

  const { email, password, displayName, role } = request.data || {};
  const normalizedRole = normalizeRole(role);
  const trimmedEmail = String(email || "").trim();

  if (!trimmedEmail || !password || !normalizedRole) {
    throw new HttpsError(
      "invalid-argument",
      "email, password, and role are required."
    );
  }

  if (!VALID_ROLES.includes(normalizedRole)) {
    throw new HttpsError("invalid-argument", "The specified role is not valid.");
  }

  assertAdminAllowedRole(request, callerRole, normalizedRole, "create");

  try {
    const userRecord = await admin.auth().createUser({
      email: trimmedEmail,
      password: String(password),
      displayName: displayName ? String(displayName).trim() : undefined,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: normalizedRole,
    });

    await admin.firestore().collection("users").doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        email: trimmedEmail,
        displayName: displayName ? String(displayName).trim() : "",
        role: normalizedRole,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    logger.info(
      `Successfully created user ${userRecord.uid} with role ${normalizedRole}`
    );

    return {
      uid: userRecord.uid,
      email: userRecord.email || trimmedEmail,
      message: "User created successfully.",
    };
  } catch (error) {
    logger.error("Create user error:", error);
    throwAsHttpsError(error);
  }
});

exports.editUserAccount = onCall({ cors: true }, async (request) => {
  assertAuthenticated(request);

  const callerRole = getCallerRole(request);
  logger.info(
    `Caller UID ${request.auth.uid} Role ${callerRole} Action editUserAccount`
  );

  assertCallerIsAdminOrSuperAdmin(request, callerRole, "edit");

  const { uid, email, password, displayName, role } = request.data || {};
  const trimmedUid = String(uid || "").trim();
  const normalizedRole = role !== undefined ? normalizeRole(role) : "";

  if (!trimmedUid) {
    throw new HttpsError("invalid-argument", "uid is required.");
  }

  if (role !== undefined && !normalizedRole) {
    throw new HttpsError("invalid-argument", "role is invalid.");
  }

  if (normalizedRole && !VALID_ROLES.includes(normalizedRole)) {
    throw new HttpsError("invalid-argument", "The specified role is not valid.");
  }

  const hasUpdates =
    email !== undefined ||
    password !== undefined ||
    displayName !== undefined ||
    normalizedRole;

  if (!hasUpdates) {
    throw new HttpsError("invalid-argument", "No updates provided.");
  }

  try {
    if (callerRole === "admin") {
      const targetRole = await getTargetRole(trimmedUid);
      assertAdminAllowedRole(request, callerRole, targetRole, "edit");
      if (normalizedRole) {
        assertAdminAllowedRole(request, callerRole, normalizedRole, "assign");
      }
    }

    const authUpdate = {};
    const fsUpdate = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (email !== undefined) {
      const trimmedEmail = String(email).trim();
      if (!trimmedEmail) {
        throw new HttpsError("invalid-argument", "email is required.");
      }
      authUpdate.email = trimmedEmail;
      fsUpdate.email = trimmedEmail;
    }

    if (password !== undefined) {
      const nextPassword = String(password);
      if (!nextPassword) {
        throw new HttpsError("invalid-argument", "password is required.");
      }
      authUpdate.password = nextPassword;
    }

    if (displayName !== undefined) {
      const nextDisplayName = String(displayName).trim();
      authUpdate.displayName = nextDisplayName;
      fsUpdate.displayName = nextDisplayName;
    }

    if (Object.keys(authUpdate).length > 0) {
      await admin.auth().updateUser(trimmedUid, authUpdate);
    }

    if (normalizedRole) {
      await admin.auth().setCustomUserClaims(trimmedUid, {
        role: normalizedRole,
      });
      fsUpdate.role = normalizedRole;
    }

    await admin.firestore().collection("users").doc(trimmedUid).set(fsUpdate, {
      merge: true,
    });

    logger.info(`Successfully updated user ${trimmedUid}`);

    return { uid: trimmedUid, message: "User updated successfully." };
  } catch (error) {
    logger.error("Edit user error:", error);
    throwAsHttpsError(error);
  }
});

exports.deleteUserAccount = onCall({ cors: true }, async (request) => {
  assertAuthenticated(request);

  const callerRole = getCallerRole(request);
  logger.info(
    `Caller UID ${request.auth.uid} Role ${callerRole} Action deleteUserAccount`
  );

  assertCallerIsAdminOrSuperAdmin(request, callerRole, "delete");

  const { uid } = request.data || {};
  const trimmedUid = String(uid || "").trim();

  if (!trimmedUid) {
    throw new HttpsError("invalid-argument", "uid is required.");
  }

  try {
    if (callerRole === "admin") {
      const targetRole = await getTargetRole(trimmedUid);
      assertAdminAllowedRole(request, callerRole, targetRole, "delete");
    }

    await admin.auth().deleteUser(trimmedUid);
    await admin.firestore().collection("users").doc(trimmedUid).delete();

    logger.info(`Successfully deleted user ${trimmedUid}`);

    return { uid: trimmedUid, message: "User deleted successfully." };
  } catch (error) {
    logger.error("Delete user error:", error);
    throwAsHttpsError(error);
  }
});
