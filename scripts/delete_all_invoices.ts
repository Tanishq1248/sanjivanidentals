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

async function deleteAllInvoices() {
  console.log("Fetching all invoices...");
  const snap = await getDocs(collection(db, "invoices"));
  console.log(`Found ${snap.size} invoices. Deleting all...`);

  for (const invoiceDoc of snap.docs) {
    const data = invoiceDoc.data();
    console.log(`Deleting Invoice ${invoiceDoc.id} | Patient: ${data.patientName} | Amount: ${data.total || data.amount} | Date: ${data.invoiceDate}`);
    await deleteDoc(doc(db, "invoices", invoiceDoc.id));
  }

  console.log(`\nDone. Deleted ${snap.size} invoices. Billing page is now clean.`);
}

deleteAllInvoices().catch(console.error);
