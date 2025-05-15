// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCbiWOste5KRHu_4G0IeItRyRKKvErjKXw",
  authDomain: "shortcatdev-1820a.firebaseapp.com",
  projectId: "shortcatdev-1820a",
  storageBucket: "shortcatdev-1820a.firebasestorage.app",
  messagingSenderId: "1075772694659",
  appId: "1:1075772694659:web:1185e20663811d02c1bbb6",
  measurementId: "G-CK8HV6S8YB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

export default app;
