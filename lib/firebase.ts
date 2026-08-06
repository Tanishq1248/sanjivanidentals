import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCtyPJ36OyEpmWTco0zIzRrwdMYSJ13asY",
  authDomain: "sanjivanidental-499dc.firebaseapp.com",
  projectId: "sanjivanidental-499dc",
  storageBucket: "sanjivanidental-499dc.firebasestorage.app",
  messagingSenderId: "321306085368",
  appId: "1:321306085368:web:64d3148171d1621c42380d",
  measurementId: "G-RKJ87DKLKJ"
};

// Initialize Firebase — prevent re-initialization in Next.js hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;

