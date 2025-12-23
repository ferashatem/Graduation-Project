const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Callable function: createAdminUser
 * - Only super_admin can call it
 * - Creates Firebase Auth user
 * - Sets custom claim: { role: "admin" }
 * - Creates Firestore profile doc: /users/{uid}
 */
exports.createAdminUser = functions.https.onCall(async (data, context) => {
  // 1) Must be authenticated
  if (!context.auth) {
    // callable spec: invalid/missing auth leads to UNAUTHENTICATED / 401 if token invalid
    throw new functions.https.HttpsError("unauthenticated", "Login first.");
  }

  // 2) Must be super_admin
  if (context.auth.token.role !== "super_admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only super_admin can create admins."
    );
  }

  // 3) Validate payload
  const fullName = String(data?.fullName || "").trim();
  const email = String(data?.email || "").trim().toLowerCase();
  const password = String(data?.password || "");
  const phone = String(data?.phone || "").trim();

  if (!fullName || !email || !password) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "fullName, email, password are required."
    );
  }

  // 4) Create Auth user (Admin SDK)
  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
      disabled: false
    });
  } catch (err) {
    // Common: auth/email-already-exists
    throw new functions.https.HttpsError("already-exists", err?.message || "Failed to create user.");
  }

  const uid = userRecord.uid;

  // 5) Set custom claim role=admin (Admin SDK)
  await admin.auth().setCustomUserClaims(uid, { role: "admin" });

  // 6) Create Firestore profile doc
  await admin.firestore().collection("users").doc(uid).set(
    {
      uid,
      fullName,
      email,
      phone,
      role: "admin", // convenience field (rules should rely on token.role)
      createdBy: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return { success: true, uid, role: "admin" };
});
