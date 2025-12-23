const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.createAdminUser = functions.https.onCall(async (data) => {
  const { email, password, displayName } = data || {};

  if (!email || !password) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "email and password are required"
    );
  }

  // إنشاء المستخدم
  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: displayName || "Admin",
  });

  // ادّيله role = admin
  await admin.auth().setCustomUserClaims(userRecord.uid, {
    role: "admin",
  });

  // (اختياري) حفظه في Firestore
  await admin.firestore().collection("users").doc(userRecord.uid).set({
    uid: userRecord.uid,
    email,
    displayName: displayName || "Admin",
    role: "admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    uid: userRecord.uid,
    email,
    role: "admin",
  };
});
