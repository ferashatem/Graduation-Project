import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDUGcfluzoDKLa1dt_OZcwEn0C-HFHtBVU",
  authDomain: "graduation-project-61aa9.firebaseapp.com",
  projectId: "graduation-project-61aa9",
  storageBucket: "graduation-project-61aa9.firebasestorage.app",
  messagingSenderId: "1001425488308",
  appId: "1:1001425488308:web:4742a1a2477b5ed8638ae1",
  measurementId: "G-GEGSYVRXSN",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);

export default app;
