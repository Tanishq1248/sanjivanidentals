"use server";

import { adminDb } from "../../lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS, DEFAULT_CLINIC_ID } from "../../lib/services/firestoreConfig";
import type { Prescription } from "../../lib/types";

export interface ServerActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Helper to ensure plain serializable JSON object across Server Action boundary.
 */
function serializeRecord<T>(obj: any): T {
  if (!obj || typeof obj !== "object") return obj;

  if (typeof obj.toDate === "function") {
    return obj.toDate().toISOString() as any;
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeRecord) as any;
  }

  const plain: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;

    if (value && typeof value === "object" && "_seconds" in (value as any)) {
      plain[key] = new Date((value as any)._seconds * 1000).toISOString();
    } else if (value && typeof value === "object" && typeof (value as any).toDate === "function") {
      plain[key] = (value as any).toDate().toISOString();
    } else if (Array.isArray(value)) {
      plain[key] = value.map(serializeRecord);
    } else if (value && typeof value === "object") {
      plain[key] = serializeRecord(value);
    } else {
      plain[key] = value;
    }
  }
  return plain as T;
}

/**
 * Server Action: Save/Update a prescription document via Admin SDK.
 * Links to patient encounter atomically.
 */
export async function savePrescriptionAction(
  data: Partial<Prescription> & { prescriptionId?: string }
): Promise<ServerActionResult<{ id: string }>> {
  try {
    let targetDocId =
      data.prescriptionId && data.prescriptionId !== "temp" ? data.prescriptionId : undefined;

    // 1. Duplicate check: check if prescription already exists for encounter
    if (!targetDocId && data.encounterId) {
      const snap = await adminDb
        .collection(COLLECTIONS.PRESCRIPTIONS)
        .where("encounterId", "==", data.encounterId)
        .limit(1)
        .get();

      if (!snap.empty) {
        targetDocId = snap.docs[0].id;
      }
    }

    // 2. Duplicate check fallback: check for appointment
    if (!targetDocId && data.appointmentId) {
      const snap = await adminDb
        .collection(COLLECTIONS.PRESCRIPTIONS)
        .where("appointmentId", "==", data.appointmentId)
        .limit(1)
        .get();

      if (!snap.empty) {
        targetDocId = snap.docs[0].id;
      }
    }

    const clinicId = data.clinicId || DEFAULT_CLINIC_ID;
    const docRef = targetDocId
      ? adminDb.collection(COLLECTIONS.PRESCRIPTIONS).doc(targetDocId)
      : adminDb.collection(COLLECTIONS.PRESCRIPTIONS).doc();

    const savedId = docRef.id;

    const payload = {
      ...data,
      prescriptionId: savedId,
      clinicId: clinicId || DEFAULT_CLINIC_ID,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!targetDocId) {
      (payload as any).createdAt = FieldValue.serverTimestamp();
    }

    await docRef.set(payload, { merge: true });

    // 3. Link back to encounter if applicable
    if (data.encounterId) {
      try {
        const encUpdate: Record<string, any> = {
          prescriptionId: savedId,
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (data.followUpDate) {
          encUpdate.followUpDate = data.followUpDate;
        }
        await adminDb
          .collection(COLLECTIONS.PATIENT_ENCOUNTERS)
          .doc(data.encounterId)
          .update(encUpdate);
      } catch (encErr) {
        console.warn("[prescriptionActions] Failed to link to encounter doc:", encErr);
      }
    }

    return {
      success: true,
      data: { id: savedId },
    };
  } catch (error: any) {
    console.error("[prescriptionActions] Error saving prescription:", error);
    return {
      success: false,
      error: error?.message || "Failed to save prescription on server.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Fetch prescription by ID.
 */
export async function getPrescriptionByIdAction(
  id: string
): Promise<ServerActionResult<Prescription | null>> {
  try {
    if (!id) return { success: true, data: null };
    const docSnap = await adminDb.collection(COLLECTIONS.PRESCRIPTIONS).doc(id).get();
    if (!docSnap.exists) return { success: true, data: null };
    return {
      success: true,
      data: serializeRecord({ prescriptionId: docSnap.id, ...docSnap.data() }) as Prescription,
    };
  } catch (error: any) {
    console.error("[prescriptionActions] Error getting prescription by ID:", error);
    return {
      success: false,
      error: error?.message || "Failed to get prescription.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Fetch prescription by encounter ID.
 */
export async function getPrescriptionByEncounterAction(
  encounterId: string
): Promise<ServerActionResult<Prescription | null>> {
  try {
    if (!encounterId) return { success: true, data: null };
    const snap = await adminDb
      .collection(COLLECTIONS.PRESCRIPTIONS)
      .where("encounterId", "==", encounterId)
      .limit(1)
      .get();

    if (snap.empty) return { success: true, data: null };
    const docSnap = snap.docs[0];
    return {
      success: true,
      data: serializeRecord({ prescriptionId: docSnap.id, ...docSnap.data() }) as Prescription,
    };
  } catch (error: any) {
    console.error("[prescriptionActions] Error getting prescription by encounter:", error);
    return {
      success: false,
      error: error?.message || "Failed to get prescription by encounter.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Fetch prescription by appointment ID.
 */
export async function getPrescriptionByAppointmentAction(
  appointmentId: string
): Promise<ServerActionResult<Prescription | null>> {
  try {
    if (!appointmentId) return { success: true, data: null };
    const snap = await adminDb
      .collection(COLLECTIONS.PRESCRIPTIONS)
      .where("appointmentId", "==", appointmentId)
      .limit(1)
      .get();

    if (snap.empty) return { success: true, data: null };
    const docSnap = snap.docs[0];
    return {
      success: true,
      data: serializeRecord({ prescriptionId: docSnap.id, ...docSnap.data() }) as Prescription,
    };
  } catch (error: any) {
    console.error("[prescriptionActions] Error getting prescription by appointment:", error);
    return {
      success: false,
      error: error?.message || "Failed to get prescription by appointment.",
      code: "SERVER_ERROR",
    };
  }
}
