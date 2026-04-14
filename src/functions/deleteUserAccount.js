import { getAuth, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, deleteDoc, getFirestore } from "firebase/firestore";

const auth = getAuth();
const db = getFirestore();

const handleDeleteAccount = async (password) => {
  const user = auth.currentUser;

  if (!user) return;

  try {
    // 1. Re-authenticate the user (Required for sensitive operations)
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    // 2. Delete user data from Firestore
    // Assuming your document ID matches the User UID
    await deleteDoc(doc(db, "users", user.uid));

    // 3. Delete the user from Firebase Auth
    await deleteUser(user);

    console.log("Account successfully deleted");
    // Redirect user to signup or home page here
    
  } catch (error) {
    console.error("Error deleting account:", error.message);
    if (error.code === 'auth/requires-recent-login') {
      alert("Please log out and log back in to delete your account.");
    }
  }
};