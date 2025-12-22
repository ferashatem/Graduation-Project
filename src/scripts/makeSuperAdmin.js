const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

(async () => {
  const uid = "fD5mOubtTLYpw1rwMvj3LrT325d2";
  await admin.auth().setCustomUserClaims(uid, { role: "super_admin" });
  console.log("✅ super_admin created");
  process.exit(0);
})();
