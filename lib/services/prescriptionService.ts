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

import { updatePatientEncounter } from "./patientService";

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
 * Check if a prescription already exists for a given encounter ID.
 */
export async function getPrescriptionByEncounter(
  encounterId: string
): Promise<Prescription | null> {
  if (!encounterId) return null;
  const q = query(
    prescriptionsRef,
    where("encounterId", "==", encounterId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { prescriptionId: d.id, ...d.data() } as Prescription;
}

/**
 * Check if a prescription already exists for a given appointment ID.
 */
export async function getPrescriptionByAppointment(
  appointmentId: string
): Promise<Prescription | null> {
  if (!appointmentId) return null;
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
 * or if a prescription already exists for the encounterId, it will overwrite/update the existing document.
 * Links the prescriptionId back to the patientEncounters document.
 */
export async function savePrescription(
  data: Omit<Prescription, "createdAt" | "updatedAt" | "prescriptionId"> & {
    prescriptionId?: string;
  }
): Promise<string> {
  const now = Timestamp.now();
  let targetDocId = data.prescriptionId && data.prescriptionId !== "temp" ? data.prescriptionId : undefined;

  // Duplicate protection: Check if prescription already exists for this encounter
  if (!targetDocId && data.encounterId) {
    const existingForEncounter = await getPrescriptionByEncounter(data.encounterId);
    if (existingForEncounter) {
      targetDocId = existingForEncounter.prescriptionId;
    }
  }

  // Duplicate protection fallback: Check if prescription exists for appointment
  if (!targetDocId && data.appointmentId) {
    const existingForApt = await getPrescriptionByAppointment(data.appointmentId);
    if (existingForApt) {
      targetDocId = existingForApt.prescriptionId;
    }
  }

  let docRef;

  if (targetDocId) {
    docRef = doc(db, COLLECTION, targetDocId);
    const original = await getDoc(docRef);
    const createdAt = original.exists() ? original.data()?.createdAt || now : now;

    await setDoc(docRef, {
      ...data,
      prescriptionId: targetDocId,
      createdAt,
      updatedAt: now,
    });
  } else {
    docRef = doc(prescriptionsRef);
    await setDoc(docRef, {
      ...data,
      prescriptionId: docRef.id,
      createdAt: now,
      updatedAt: now,
    });
  }

  const savedId = docRef.id;

  // Link prescriptionId & followUpDate back to the encounter document if encounterId is set
  if (data.encounterId) {
    try {
      const encounterUpdate: Record<string, any> = { prescriptionId: savedId };
      if (data.followUpDate) {
        encounterUpdate.followUpDate = data.followUpDate;
      }
      await updatePatientEncounter(data.encounterId, encounterUpdate);
    } catch (err) {
      console.warn("Failed to link prescriptionId to encounter:", err);
    }
  }

  return savedId;
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
