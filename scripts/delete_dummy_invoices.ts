import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "firebase/firestore";
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

async function cleanDummyInvoices() {
  console.log("Fetching patients and invoices...");
  const [patientsSnap, invoicesSnap] = await Promise.all([
    getDocs(collection(db, "patients")),
    getDocs(collection(db, "invoices")),
  ]);

  const activePatientIds = new Set(patientsSnap.docs.map((d) => d.id));
  console.log(`Active patients in DB: ${activePatientIds.size}`);
  console.log(`Total invoices in DB: ${invoicesSnap.size}`);

  let deletedCount = 0;

  for (const invoiceDoc of invoicesSnap.docs) {
    const data = invoiceDoc.data();
    const patientId = data.patientId;
    const patientName = data.patientName;

    // Delete if patientId doesn't exist in active patients, OR if patientName is empty/N/A
    const isDummy = !patientId || !activePatientIds.has(patientId) || !patientName || patientName === "N/A";

    if (isDummy) {
      console.log(`Deleting dummy invoice ID: ${invoiceDoc.id} (Patient Name: ${patientName || "N/A"}, Patient ID: ${patientId || "N/A"})`);
      await deleteDoc(doc(db, "invoices", invoiceDoc.id));
      deletedCount++;
    }
  }

  console.log(`Clean up completed. Deleted ${deletedCount} dummy invoices.`);
}

cleanDummyInvoices().catch(console.error);
