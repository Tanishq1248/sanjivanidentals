import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { config } from "dotenv";
config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  console.log("Listing all patients in the database...");
  try {
    const snap = await getDocs(collection(db, "patients"));
    console.log(`Total patients found: ${snap.size}`);
    snap.forEach((doc) => {
      console.log(`ID: ${doc.id} | Name: ${doc.data().name} | Phone: ${doc.data().phone}`);
    });
  } catch (err) {
    console.error("Error fetching patients:", err);
  }
}

check();
