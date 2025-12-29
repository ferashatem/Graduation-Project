import {
  collection,
  doc,
  endAt,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
  where,
} from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

export const searchUsersByRole = async ({
  roles,
  search,
  field = "name",
  limitCount = 10,
}) => {
  const trimmedSearch = String(search || "").trim();
  if (!trimmedSearch) return [];

  const roleList = Array.isArray(roles)
    ? roles.map((role) => String(role).trim()).filter(Boolean)
    : [];

  const constraints = [];
  if (roleList.length === 1) {
    constraints.push(where("role", "==", roleList[0]));
  } else if (roleList.length > 1) {
    constraints.push(where("role", "in", roleList));
  }

  constraints.push(orderBy(field));
  constraints.push(startAt(trimmedSearch));
  constraints.push(endAt(`${trimmedSearch}\uf8ff`));
  constraints.push(limit(limitCount));

  const snapshot = await getDocs(query(collection(db, "users"), ...constraints));
  return snapshot.docs.map(mapDoc);
};

export const fetchUsersByIds = async (userIds = []) => {
  const ids = Array.from(
    new Set((userIds || []).map((id) => String(id).trim()).filter(Boolean))
  );
  if (ids.length === 0) return [];

  const snapshots = await Promise.all(
    ids.map((id) => getDoc(doc(db, "users", id)))
  );

  return snapshots.filter((snap) => snap.exists()).map(mapDoc);
};
