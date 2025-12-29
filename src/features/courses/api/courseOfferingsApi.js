import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../../../firebase/firebaseConfig";

const callFunction = async (name, payload) => {
  if (auth?.currentUser) {
    await auth.currentUser.getIdToken(true);
  }
  const fn = httpsCallable(functions, name);
  const result = await fn(payload);
  return result.data;
};

export const listOfferings = async ({ courseId, termId }) =>
  callFunction("listOfferings", { courseId, termId });

export const createOffering = async ({
  courseId,
  departmentId,
  termId,
  termName,
  sectionCode,
  capacity,
}) =>
  callFunction("createOffering", {
    courseId,
    departmentId,
    termId,
    termName,
    sectionCode,
    capacity,
  });

export const assignInstructor = async ({ offeringId, userId, role }) =>
  callFunction("assignInstructor", { offeringId, userId, role });

export const unassignInstructor = async ({ offeringId, userId, role }) =>
  callFunction("unassignInstructor", { offeringId, userId, role });
