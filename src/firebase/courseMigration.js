import { getDocs, writeBatch } from "firebase/firestore";
import { db } from "./firebaseConfig";
import {
  collegesCollection,
  departmentsCollection,
  coursesCollection,
  yearsCollection,
} from "./firestorePaths";

const createBatchQueue = () => {
  const batches = [];
  let currentBatch = writeBatch(db);
  let opCount = 0;

  const queueUpdate = (ref, data) => {
    if (opCount >= 400) {
      batches.push(currentBatch);
      currentBatch = writeBatch(db);
      opCount = 0;
    }
    currentBatch.update(ref, data);
    opCount += 1;
  };

  const flush = () => {
    if (opCount > 0) batches.push(currentBatch);
    return batches;
  };

  return { queueUpdate, flush };
};

export const backfillCourseMetadata = async () => {
  const { queueUpdate, flush } = createBatchQueue();
  let updatedCount = 0;

  const collegesSnap = await getDocs(collegesCollection());
  for (const collegeSnap of collegesSnap.docs) {
    const collegeId = collegeSnap.id;
    const yearsSnap = await getDocs(yearsCollection(collegeId));

    for (const yearSnap of yearsSnap.docs) {
      const yearId = yearSnap.id;
      const yearName = yearSnap.data()?.name || "";
      const departmentsSnap = await getDocs(departmentsCollection(collegeId, yearId));

      for (const departmentSnap of departmentsSnap.docs) {
        const departmentId = departmentSnap.id;
        const departmentName = departmentSnap.data()?.name || "";
        const coursesSnap = await getDocs(
          coursesCollection(collegeId, yearId, departmentId)
        );

        for (const courseSnap of coursesSnap.docs) {
          const data = courseSnap.data() || {};
          const updates = {};
          if (!data.collegeId) updates.collegeId = collegeId;
          if (!data.yearId) updates.yearId = yearId;
          if (!data.departmentId) updates.departmentId = departmentId;
          if (yearName && !data.yearName) updates.yearName = yearName;
          if (departmentName && !data.departmentName)
            updates.departmentName = departmentName;
          if (data.name && !data.name_lc)
            updates.name_lc = String(data.name).toLowerCase();

          if (Object.keys(updates).length > 0) {
            queueUpdate(courseSnap.ref, updates);
            updatedCount += 1;
          }
        }
      }
    }
  }

  const batches = flush();
  for (const batch of batches) {
    await batch.commit();
  }

  return { updatedCount };
};

