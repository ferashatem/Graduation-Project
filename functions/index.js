// functions/index.js (or index.ts)
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

exports.createUserWithRole = onCall(async (request) => {
  // 1) Must be logged in
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  // 2) Read caller role from custom claims
  const callerRole = request.auth.token.role;

  // 3) Authorize caller
  const allowed = callerRole === "super_admin" ;
  if (!allowed) {
    throw new HttpsError("permission-denied", "Not allowed.");
  }

  // 4) Validate input
  const { email, password, displayName, role } = request.data || {};
  if (!email || !password || !role) {
    throw new HttpsError("invalid-argument", "Missing email/password/role.");
  }

  const allowedNewRoles =
    callerRole === "super_admin"
      ? ["super_admin", "admin", "professor", "assistant", "student"]
      : ["professor", "assistant", "student"]; // example restriction for admin

  if (!allowedNewRoles.includes(role)) {
    throw new HttpsError("invalid-argument", "Role not allowed.");
  }

  // 5) Create user
  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: displayName || undefined,
  });

  // 6) Set custom claims
  await admin.auth().setCustomUserClaims(userRecord.uid, { role });

  // 7) (Optional but recommended) Create a Firestore profile doc
  await admin.firestore().collection("users").doc(userRecord.uid).set({
    email,
    displayName: displayName || "",
    role,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, uid: userRecord.uid };
});


// const functions = require("firebase-functions");
// const admin = require("firebase-admin");

// admin.initializeApp();

// exports.addAdminRole = functions.https.onCall((data, context) => {
//   return admin
//     .auth()
//     .getUserByEmail(data.email)
//     .then((user) => {
//       return admin.auth().setCustomUserClaims(user.uid, { admin: true });
//     })
//     .then(() => {
//       return {
//         message: `Success! ${data.email} has been made an admin`,
//       };
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// });

