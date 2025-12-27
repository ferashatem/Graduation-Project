import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/firebaseConfig";

export const createAdminUser = async (data) => {
  const fn = httpsCallable(functions, "createAdminUser");
  const res = await fn(data);
  return res.data;
};
