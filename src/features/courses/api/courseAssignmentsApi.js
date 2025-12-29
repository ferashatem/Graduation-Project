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

export const upsertAssignment = async ({
  courseId,
  termId,
  yearLevel,
  section,
  professorId,
  assistantIds,
}) =>
  callFunction("upsertAssignment", {
    courseId,
    termId,
    yearLevel,
    section,
    professorId,
    assistantIds,
  });
