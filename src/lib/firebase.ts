import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration de votre propre projet Firebase (moneyflow-pro-f8c70)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBaSJY3jAroYnbVsWNaV8hJ1B9rfgn2mJk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "moneyflow-pro-f8c70.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "moneyflow-pro-f8c70",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "moneyflow-pro-f8c70.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "326768457633",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:326768457633:web:4e4a203d2cad88c6517de0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Z4019GM6JN"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

