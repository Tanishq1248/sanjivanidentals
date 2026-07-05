import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Prescription } from "../types";

import { COLLECTIONS, getCollectionRef } from "./firestoreConfig";

const COLLECTION = COLLECTIONS.PRESCRIPTIONS;
const ARCHIVED_COLLECTION = COLLECTIONS.ARCHIVED_PRESCRIPTIONS;

// Dynamic helper to fetch prescriptions collection reference (ready to support archive querying)
function getPrescriptionsRef(queryArchived = false) {
  return getCollectionRef(db, COLLECTION, ARCHIVED_COLLECTION, queryArchived);
}

// Fallback to active collection reference by default
const prescriptionsRef = getPrescriptionsRef(false);

/**
 * Fetch a single prescription by document ID.
 */
export async function getPrescriptionById(
  id: string
): Promise<Prescription | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { prescriptionId: snap.id, ...snap.data() } as Prescription;
}

/**
 * Check if a prescription already exists for a given appointment ID.
 */
export async function getPrescriptionByAppointment(
  appointmentId: string
): Promise<Prescription | null> {
  const q = query(
    prescriptionsRef,
    where("appointmentId", "==", appointmentId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { prescriptionId: d.id, ...d.data() } as Prescription;
}

/**
 * Save a prescription. If the document already has a prescriptionId,
 * it will overwrite/update the existing one. Otherwise, it will generate a new document reference.
 */
export async function savePrescription(
  data: Omit<Prescription, "createdAt" | "updatedAt" | "prescriptionId"> & {
    prescriptionId?: string;
  }
): Promise<string> {
  const now = Timestamp.now();
  let docRef;

  if (data.prescriptionId && data.prescriptionId !== "temp") {
    docRef = doc(db, COLLECTION, data.prescriptionId);
    // Fetch original to preserve createdAt
    const original = await getDoc(docRef);
    const createdAt = original.exists()
      ? original.data()?.createdAt || now
      : now;

    await setDoc(docRef, {
      ...data,
      createdAt,
      updatedAt: now,
    });
  } else {
    // Generate new doc reference with auto-ID
    docRef = doc(prescriptionsRef);
    await setDoc(docRef, {
      ...data,
      prescriptionId: docRef.id,
      createdAt: now,
      updatedAt: now,
    });
  }

  return docRef.id;
}

/**
 * Generate a unique serial prescription number:
 * Format: DC-[YEAR]-[5-digit-random]
 */
export function generatePrescriptionNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000); // 5 digits
  return `DC-${year}-${randomNum}`;
}
