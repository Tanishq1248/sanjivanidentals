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
import { COLLECTIONS, DEFAULT_CLINIC_ID } from "./firestoreConfig";

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
  const clinicId = data.clinicId;

  const now = Timestamp.now();
  const docRef = await addDoc(invoicesRef, {
    ...data,
    clinicId: clinicId || "",
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

/** Calculate real-time payment status and UI styles dynamically */
export function getInvoiceStatusDetails(inv: Invoice) {
  const total = inv.total !== undefined ? inv.total : (inv.netAmount !== undefined ? inv.netAmount : (inv.amount || 0));
  const paid = inv.paidAmount || 0;
  const remaining = inv.remainingAmount !== undefined ? inv.remainingAmount : Math.max(0, total - paid);

  if (remaining <= 0) {
    return {
      status: "PAID",
      label: "PAID",
      bgClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotClass: "bg-emerald-500",
      colorClass: "text-emerald-700",
    };
  }

  // Doctor chose "Keep Pending" or invoice was explicitly kept pending
  if (inv.paymentStatus === "PENDING" || inv.status === "PENDING" || inv.paymentStatus === "Pending" || inv.status === "Pending") {
    return {
      status: "PENDING",
      label: "PENDING",
      bgClass: "bg-amber-50 text-amber-700 border-amber-200",
      dotClass: "bg-amber-500",
      colorClass: "text-amber-700",
    };
  }

  if (paid > 0) {
    return {
      status: "PARTIAL",
      label: "PARTIAL",
      bgClass: "bg-blue-50 text-blue-700 border-blue-200",
      dotClass: "bg-blue-500",
      colorClass: "text-blue-700",
    };
  }

  return {
    status: "UNPAID",
    label: "UNPAID",
    bgClass: "bg-red-50 text-red-700 border-red-200 font-bold",
    dotClass: "bg-red-500",
    colorClass: "text-red-700",
  };
}

export function getInvoiceStatus(inv: Invoice): string {
  return getInvoiceStatusDetails(inv).status;
}
