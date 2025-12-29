import { addDoc, serverTimestamp } from "firebase/firestore";
import { userProfsCollection } from "../../../firebase/firestorePaths";

export const createUserProfessor = async (
  userId,
  { fullName, email, phoneNumber, collegeUserId, role }
) => {
  const trimmedUserId = String(userId || "").trim();
  if (!trimmedUserId) {
    throw new Error("userId is required.");
  }

  const trimmedFullName = String(fullName || "").trim();
  const trimmedEmail = String(email || "").trim();
  const trimmedPhoneNumber = String(phoneNumber || "").trim();
  const trimmedCollegeUserId = String(collegeUserId || "").trim();

  if (
    !trimmedFullName ||
    !trimmedEmail ||
    !trimmedPhoneNumber ||
    !trimmedCollegeUserId
  ) {
    throw new Error(
      "fullName, email, phoneNumber, and collegeUserId are required."
    );
  }

  const normalizedRole = String(role || "professor").trim().toLowerCase();
  if (normalizedRole !== "professor") {
    throw new Error('role must be "professor".');
  }

  const payload = {
    fullName: trimmedFullName,
    email: trimmedEmail,
    phoneNumber: trimmedPhoneNumber,
    collegeUserId: trimmedCollegeUserId,
    role: "professor",
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(userProfsCollection(trimmedUserId), payload);
  return docRef.id;
};
