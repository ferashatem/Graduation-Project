/**
 * One-time backfill script: reads every document in the `users` collection
 * and sets the custom claim `role` on the corresponding Firebase Auth user.
 * Run this once after deploying syncRoleClaimOnUserWrite to cover existing users.
 *
 * Prerequisites:
 *   1. Install firebase-admin locally (or use the one in functions/node_modules).
 *   2. Export a service-account key and point GOOGLE_APPLICATION_CREDENTIALS at it:
 *        export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
 *   3. Run: node scripts/setRoles.js
 */

const admin = require("./functions/node_modules/firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();
const auth = admin.auth();

async function main() {
  const snapshot = await db.collection("users").get();

  if (snapshot.empty) {
    console.log("No documents found in the users collection.");
    process.exit(0);
  }

  console.log(`Found ${snapshot.size} user document(s). Processing...`);

  const results = await Promise.allSettled(
    snapshot.docs.map(async (docSnap) => {
      const uid = docSnap.id;
      const data = docSnap.data();
      const role = data.role ? String(data.role).trim().toLowerCase() : "student";

      await auth.setCustomUserClaims(uid, { role });
      return { uid, role };
    })
  );

  let succeeded = 0;
  let failed = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      console.log(`  ✓  uid=${result.value.uid}  role=${result.value.role}`);
      succeeded++;
    } else {
      console.error(`  ✗  ${result.reason?.message || result.reason}`);
      failed++;
    }
  }

  console.log(`\nDone. ${succeeded} succeeded, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
