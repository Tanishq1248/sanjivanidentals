import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
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

async function fixInvoiceStatuses() {
  console.log("Fetching invoices...");
  const snap = await getDocs(collection(db, "invoices"));

  let updatedCount = 0;

  for (const invoiceDoc of snap.docs) {
    const data = invoiceDoc.data();
    const currentStatus = data.status || data.paymentStatus || "Pending";
    const paidAmount = data.paidAmount || 0;
    
    // If the invoice has no actual payments but is marked Paid or Partial, reset it
    if (paidAmount === 0 && (currentStatus === "Paid" || currentStatus === "Partial")) {
      console.log(`Fixing status of Invoice ${invoiceDoc.id}: changing from '${currentStatus}' to 'Pending'`);
      const ref = doc(db, "invoices", invoiceDoc.id);
      await updateDoc(ref, {
        status: "Pending",
        paymentStatus: "Pending"
      });
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} invoices.`);
}

fixInvoiceStatuses().catch(console.error);
