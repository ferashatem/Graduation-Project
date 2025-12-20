const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.bootstrapSuperAdmin = functions.https.onRequest(async (req, res) => {
  // (Optional) very basic protection: require a secret query param
  // const secret = req.query.secret;
  // if (secret !== "CHANGE_ME") return res.status(403).send("Forbidden");

  const uid = req.query.uid;
  if (!uid) return res.status(400).send("Missing uid");

  await admin.auth().setCustomUserClaims(uid, { role: "super_admin" });
  return res.status(200).send(`✅ super_admin set for uid=${uid}`);
});
