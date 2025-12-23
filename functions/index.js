const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * createAdminUser (callable)
 * - Only super_admin can call it
 * - Creates Firebase Auth user
 * - Sets custom claim: { role: "admin" }
 * - Creates/updates Firestore profile doc under /users/{uid}
 */
exports.createAdminUser = functions.https.onCall(async (data, context) => {
  // ✅ 1) Must be authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login required.");
  }

  // ✅ 2) Must be super_admin
  if (context.auth.token.role !== "super_admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only super_admin can create admins."
    );
  }

  const { fullName, email, password, phoneNumber } = data || {};

  // ✅ 3) Validate input
  if (!fullName || !email || !password) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "fullName, email, password are required."
    );
  }

  // ✅ 4) Create Auth user (Admin SDK)
  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email: String(email).trim(),
      password: String(password),
      displayName: String(fullName).trim(),
      disabled: false,
    });
  } catch (err) {
    // common: auth/email-already-exists
    throw new functions.https.HttpsError("already-exists", err.message);
  }

  const uid = userRecord.uid;

  // ✅ 5) Set custom claim role=admin
  await admin.auth().setCustomUserClaims(uid, { role: "admin" });

  // ✅ 6) Create Firestore profile doc (optional but recommended)
  await admin.firestore().collection("users").doc(uid).set(
    {
      uid,
      fullName: String(fullName).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phoneNumber ? String(phoneNumber).trim() : "",
      role: "admin", // convenience field (rules should still rely on claim)
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid, // who created this admin
    },
    { merge: true }
  );

  return { success: true, uid, role: "admin" };
});
