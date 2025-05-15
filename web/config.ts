// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "",
  authDomain: "shortcatdev-1820a.firebaseapp.com",
  projectId: "",
  storageBucket: "shortcatdev-1820a.firebasestorage.app",
  messagingSenderId: "1075772694659",
  appId: "1:1075772694659:web:1185e20663811d02c1bbb6",
  measurementId: "G-CK8HV6S8YB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);