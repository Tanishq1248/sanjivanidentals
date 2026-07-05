import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Invoice } from "../types";
import { COLLECTIONS } from "./firestoreConfig";

const COLLECTION = COLLECTIONS.INVOICES;
const invoicesRef = collection(db, COLLECTION);

/** Fetch all invoices, ordered by creation date descending. */
export async function getInvoices(): Promise<Invoice[]> {
  const q = query(invoicesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Invoice);
}

/** Fetch invoices belonging to a specific patient. Ordered client-side or using YYYY-MM-DD. */
export async function getInvoicesByPatientId(patientId: string): Promise<Invoice[]> {
  const q = query(invoicesRef, where("patientId", "==", patientId));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Invoice);
  return list.sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
}

/** Fetch a single invoice by document ID. */
export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Invoice;
}

/** Create a new invoice document. Returns the generated document ID. */
export async function addInvoice(
  data: Omit<Invoice, "id" | "createdAt">
): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(invoicesRef, {
    ...data,
    createdAt: now,
  });
  return docRef.id;
}

/** Update fields on an existing invoice. */
export async function updateInvoice(
  id: string,
  data: Partial<Omit<Invoice, "id" | "createdAt">>
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...data,
  });
}

/** Delete an invoice document. */
export async function deleteInvoice(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
