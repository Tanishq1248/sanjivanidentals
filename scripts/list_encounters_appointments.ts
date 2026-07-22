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

async function listAll() {
  const [encSnap, apptSnap] = await Promise.all([
    getDocs(collection(db, "patientEncounters")),
    getDocs(collection(db, "appointments")),
  ]);

  console.log(`Total Encounters in DB: ${encSnap.size}`);
  encSnap.forEach((doc) => {
    const data = doc.data();
    console.log(`Encounter ID: ${doc.id} | PatientId: ${data.patientId} | Date: ${data.visitDate} | Doctor: ${data.doctorName}`);
  });

  console.log(`\nTotal Appointments in DB: ${apptSnap.size}`);
  apptSnap.forEach((doc) => {
    const data = doc.data();
    console.log(`Appointment ID: ${doc.id} | Patient: ${data.patientName} | Phone: ${data.patientPhone} | Date: ${data.date} | Status: ${data.status}`);
  });
}

listAll().catch(console.error);
