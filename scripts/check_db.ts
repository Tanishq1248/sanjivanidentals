import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
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
  console.log("Searching for patient 'Anuradha'...");
  const patientsSnap = await getDocs(collection(db, "patients"));
  let targetPatientId = "";
  patientsSnap.forEach((doc) => {
    const data = doc.data();
    if (data.name && data.name.includes("Anuradha")) {
      console.log(`Found Patient: ${data.name} (ID: ${doc.id})`);
      targetPatientId = doc.id;
    }
  });

  if (!targetPatientId) {
    console.log("No patient named 'Anuradha' found.");
    return;
  }

  console.log(`Fetching encounters for patient ID: ${targetPatientId}...`);
  const q = query(collection(db, "patientEncounters"), where("patientId", "==", targetPatientId));
  const snap = await getDocs(q);
  console.log(`Total encounters found: ${snap.size}`);
  snap.forEach((doc) => {
    console.log(`Encounter ID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
    console.log("------------------------");
  });
}

check();
