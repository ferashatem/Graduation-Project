import { httpsCallable } from "firebase/functions";
import { functions } from "./firebaseConfig";

export const setAttendance = async (payload) => {
  const fn = httpsCallable(functions, "setAttendance");
  const result = await fn(payload);
  return result.data;
};

export const pushEngagement = async (payload) => {
  const fn = httpsCallable(functions, "pushEngagement");
  const result = await fn(payload);
  return result.data;
};
