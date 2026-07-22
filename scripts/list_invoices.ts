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

async function listInvoices() {
  const invoicesSnap = await getDocs(collection(db, "invoices"));
  console.log(`Total invoices in Firestore: ${invoicesSnap.size}`);
  invoicesSnap.forEach((doc) => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Patient: ${data.patientName || "N/A"} | Date: ${data.invoiceDate || "N/A"} | Amount: ${data.total || data.amount || 0} | Paid: ${data.paidAmount ?? 0} | Remaining: ${data.remainingAmount ?? (data.total || data.amount || 0) - (data.paidAmount || 0)} | Status: ${data.paymentStatus || data.status || "N/A"} | EncounterId: ${data.encounterId || "N/A"}`);
  });
}

listInvoices();
