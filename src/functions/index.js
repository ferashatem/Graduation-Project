// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * ✅ setUserRole (Callable Function)
 * Only super_admin can assign roles
 * roles: super_admin | admin | prof | assistant | student
 */

/** helper: require caller to be super_admin */
function assertSuperAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login first.");
  }
  const role = context.auth.token?.role;
  if (role !== "super_admin") {
    throw new functions.https.HttpsError("permission-denied", "Super admin only.");
  }
}

/**
 * data: { email, password, fullName, phone }
 * Creates an Auth user, sets { role: "admin" }, and writes Firestore profile.
 */
exports.createAdminUser = functions.https.onCall(async (data, context) => {
  assertSuperAdmin(context);

  const { email, password, fullName, phone } = data || {};
  if (!email || !password || !fullName) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "email, password, fullName are required."
    );
  }

  // 1) Create Auth user
  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: fullName,
  });

  const uid = userRecord.uid;

  // 2) Set custom claim
  await admin.auth().setCustomUserClaims(uid, { role: "admin" });

  // 3) Save profile in Firestore (Admins/{uid})
  await admin.firestore().doc(`Admins/${uid}`).set(
    {
      uid,
      email,
      fullName,
      phone: phone || "",
      role: "admin", // optional mirror (claims are source of truth for auth)
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid, // super admin uid
    },
    { merge: true }
  );

  return { ok: true, uid };
});



exports.setUserRole = functions.https.onCall(async (data, context) => {
  // 1) لازم يكون عامل login
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in."
    );
  }

  // 2) لازم اللي بينادي يكون super_admin
  const callerRole = context.auth.token.role;
  if (callerRole !== "super_admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only super_admin can set roles."
    );
  }

  // 3) validate input
  const { uid, role } = data || {};
  const allowedRoles = ["super_admin", "admin", "prof", "assistant", "student"];

  if (!uid || typeof uid !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "uid is required.");
  }
  if (!allowedRoles.includes(role)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `role must be one of: ${allowedRoles.join(", ")}`
    );
  }

  // 4) set custom claim
  await admin.auth().setCustomUserClaims(uid, { role });

  return { ok: true, uid, role };
});
