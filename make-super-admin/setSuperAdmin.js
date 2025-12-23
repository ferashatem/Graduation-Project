// setSuperAdmin.js
const admin = require("firebase-admin");

// 1) Load service account key (downloaded from Firebase Console)
const serviceAccount = require("./serviceAccountKey.json");

// 2) Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function main() {
  // ✅ Put your user's UID here:
  const uid = "9p6aR5ct0gcdakshREdB4wLw1872";

  // 3) Set custom claim
  await admin.auth().setCustomUserClaims(uid, {
    role: "super_admin",
  });

  // Optional: verify by reading the user record
  const user = await admin.auth().getUser(uid);
  console.log("✅ Updated claims:", user.customClaims);

  console.log("✅ Done. User is now super_admin.");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
