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
import { COLLECTIONS, getCollectionRef, DEFAULT_CLINIC_ID } from "./firestoreConfig";
import {
  savePrescriptionAction,
  getPrescriptionByIdAction,
  getPrescriptionByEncounterAction,
  getPrescriptionByAppointmentAction,
} from "../../server/actions/prescriptionActions";

const COLLECTION = COLLECTIONS.PRESCRIPTIONS;
const ARCHIVED_COLLECTION = COLLECTIONS.ARCHIVED_PRESCRIPTIONS;

function getPrescriptionsRef(queryArchived = false) {
  return getCollectionRef(db, COLLECTION, ARCHIVED_COLLECTION, queryArchived);
}

const prescriptionsRef = getPrescriptionsRef(false);

/**
 * Fetch a single prescription by document ID.
 */
export async function getPrescriptionById(
  id: string
): Promise<Prescription | null> {
  try {
    const res = await getPrescriptionByIdAction(id);
    if (res.success && res.data !== undefined) {
      return res.data;
    }
  } catch (err) {
    console.warn("[prescriptionService] Server get error, falling back to client:", err);
  }

  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return { prescriptionId: snap.id, ...snap.data() } as Prescription;
  } catch (err) {
    console.error("[prescriptionService] Client get error:", err);
    return null;
  }
}

/**
 * Check if a prescription already exists for a given encounter ID.
 */
export async function getPrescriptionByEncounter(
  encounterId: string
): Promise<Prescription | null> {
  if (!encounterId) return null;

  try {
    const res = await getPrescriptionByEncounterAction(encounterId);
    if (res.success && res.data !== undefined) {
      return res.data;
    }
  } catch (err) {
    console.warn("[prescriptionService] Server get by encounter error:", err);
  }

  try {
    const q = query(
      prescriptionsRef,
      where("encounterId", "==", encounterId),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { prescriptionId: d.id, ...d.data() } as Prescription;
  } catch (err) {
    return null;
  }
}

/**
 * Check if a prescription already exists for a given appointment ID.
 */
export async function getPrescriptionByAppointment(
  appointmentId: string
): Promise<Prescription | null> {
  if (!appointmentId) return null;

  try {
    const res = await getPrescriptionByAppointmentAction(appointmentId);
    if (res.success && res.data !== undefined) {
      return res.data;
    }
  } catch (err) {
    console.warn("[prescriptionService] Server get by appt error:", err);
  }

  try {
    const q = query(
      prescriptionsRef,
      where("appointmentId", "==", appointmentId),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { prescriptionId: d.id, ...d.data() } as Prescription;
  } catch (err) {
    return null;
  }
}

/**
 * Save a prescription via Server Action (guaranteed write and permission bypass).
 * Links the prescriptionId back to the patientEncounters document.
 */
export async function savePrescription(
  data: Omit<Prescription, "createdAt" | "updatedAt" | "prescriptionId"> & {
    prescriptionId?: string;
  }
): Promise<string> {
  const res = await savePrescriptionAction(data);
  if (!res.success || !res.data) {
    throw new Error(res.error || "Failed to save prescription on server.");
  }
  return res.data.id;
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
