// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDUGcfluzoDKLa1dt_OZcwEn0C-HFHtBVU",
  authDomain: "graduation-project-61aa9.firebaseapp.com",
  projectId: "graduation-project-61aa9",
  storageBucket: "graduation-project-61aa9.firebasestorage.app",
  messagingSenderId: "1001425488308",
  appId: "1:1001425488308:web:4742a1a2477b5ed8638ae1",
  measurementId: "G-GEGSYVRXSN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export { app, analytics };