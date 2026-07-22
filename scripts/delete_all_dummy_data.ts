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

async function cleanAllOrphanedData() {
  console.log("Fetching active patients from 'patients' collection...");
  const patientsSnap = await getDocs(collection(db, "patients"));
  const activePatientIds = new Set(patientsSnap.docs.map((d) => d.id));
  console.log(`Active patient IDs in database: ${activePatientIds.size}`);

  // 1. Patient Encounters
  console.log("\nChecking 'patientEncounters'...");
  const encountersSnap = await getDocs(collection(db, "patientEncounters"));
  let deletedEncounters = 0;
  for (const snap of encountersSnap.docs) {
    const data = snap.data();
    if (!data.patientId || !activePatientIds.has(data.patientId)) {
      console.log(`Deleting orphaned encounter: ${snap.id} (Patient ID: ${data.patientId || "N/A"})`);
      await deleteDoc(doc(db, "patientEncounters", snap.id));
      deletedEncounters++;
    }
  }
  console.log(`Deleted ${deletedEncounters} orphaned encounters.`);

  // 2. Patient Medical Profiles
  console.log("\nChecking 'patientMedicalProfiles'...");
  const profilesSnap = await getDocs(collection(db, "patientMedicalProfiles"));
  let deletedProfiles = 0;
  for (const snap of profilesSnap.docs) {
    const data = snap.data();
    if (!data.patientId || !activePatientIds.has(data.patientId)) {
      console.log(`Deleting orphaned medical profile: ${snap.id} (Patient ID: ${data.patientId || "N/A"})`);
      await deleteDoc(doc(db, "patientMedicalProfiles", snap.id));
      deletedProfiles++;
    }
  }
  console.log(`Deleted ${deletedProfiles} orphaned medical profiles.`);

  // 3. Prescriptions
  console.log("\nChecking 'prescriptions'...");
  const prescriptionsSnap = await getDocs(collection(db, "prescriptions"));
  let deletedPrescriptions = 0;
  for (const snap of prescriptionsSnap.docs) {
    const data = snap.data();
    if (!data.patientId || !activePatientIds.has(data.patientId)) {
      console.log(`Deleting orphaned prescription: ${snap.id} (Patient ID: ${data.patientId || "N/A"})`);
      await deleteDoc(doc(db, "prescriptions", snap.id));
      deletedPrescriptions++;
    }
  }
  console.log(`Deleted ${deletedPrescriptions} orphaned prescriptions.`);

  // 4. Invoices
  console.log("\nChecking 'invoices'...");
  const invoicesSnap = await getDocs(collection(db, "invoices"));
  let deletedInvoices = 0;
  for (const snap of invoicesSnap.docs) {
    const data = snap.data();
    if (!data.patientId || !activePatientIds.has(data.patientId) || data.patientName === "N/A") {
      console.log(`Deleting orphaned invoice: ${snap.id} (Patient ID: ${data.patientId || "N/A"}, Name: ${data.patientName || "N/A"})`);
      await deleteDoc(doc(db, "invoices", snap.id));
      deletedInvoices++;
    }
  }
  console.log(`Deleted ${deletedInvoices} orphaned invoices.`);

  console.log("\nCleanup successfully completed.");
}

cleanAllOrphanedData().catch(console.error);
