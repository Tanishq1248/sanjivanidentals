"use server";

import { adminDb } from "../../lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS, DEFAULT_CLINIC_ID } from "../../lib/services/firestoreConfig";
import type { Appointment, AppointmentStatus } from "../../lib/types";

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
 * Sanitize input dictionary to remove all undefined values and assign safe defaults.
 * Firestore Admin SDK strictly forbids `undefined` values.
 */
function sanitizeAppointmentPayload(data: Record<string, any>): Record<string, any> {
  const patientName = (data.patientName || data.name || "").trim();
  const patientPhone = (data.patientPhone || data.phone || data.whatsapp || "").trim();
  const patientEmail = (data.patientEmail || data.email || "").trim();
  const patientId = data.patientId || "";
  const doctorId = data.doctorId || null;
  const doctorName = data.doctorName || "";
  const chairId = data.chairId || null;
  const chair = data.chair || "";
  const date = data.date || data.appointmentDate || "";
  const time = data.time || data.startTime || "";
  const service = data.service || data.procedure || "Consultation";
  const duration = typeof data.duration === "number" ? data.duration : (parseInt(data.duration, 10) || 30);
  const status = data.status || "Confirmed";
  const notes = data.notes || "";
  const source = data.source || "online_booking";
  const clinicId = data.clinicId || DEFAULT_CLINIC_ID;

  const sanitized: Record<string, any> = {
    patientName,
    patientPhone,
    patientEmail,
    patientId,
    doctorId,
    doctorName,
    chairId,
    chair,
    date,
    time,
    service,
    duration,
    status,
    notes,
    source,
    clinicId,
  };

  // Copy any extra non-undefined fields safely
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && !(k in sanitized)) {
      sanitized[k] = v;
    }
  }

  return sanitized;
}

/**
 * Server Action: Create an appointment securely via Admin SDK.
 * Validates inputs, replaces all undefined fields with null/empty defaults,
 * and handles runtime errors gracefully.
 */
export async function createAppointmentAction(
  data: Record<string, any>
): Promise<ServerActionResult<{ id: string }>> {
  try {
    if (!data || typeof data !== "object") {
      return {
        success: false,
        error: "Invalid appointment payload.",
        code: "INVALID_ARGUMENT",
      };
    }

    const sanitizedData = sanitizeAppointmentPayload(data);

    if (!sanitizedData.patientName) {
      return {
        success: false,
        error: "Patient name is required.",
        code: "INVALID_ARGUMENT",
      };
    }

    if (!sanitizedData.date || !sanitizedData.time) {
      return {
        success: false,
        error: "Appointment date and time are required.",
        code: "INVALID_ARGUMENT",
      };
    }

    const payload = {
      ...sanitizedData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection(COLLECTIONS.APPOINTMENTS).add(payload);

    return {
      success: true,
      data: { id: docRef.id },
    };
  } catch (error: any) {
    console.error("[appointmentActions] Error creating appointment on server:", error);
    return {
      success: false,
      error: error?.message || "Failed to create appointment on server.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Update appointment status via Admin SDK.
 */
export async function updateAppointmentStatusAction(
  id: string,
  status: AppointmentStatus
): Promise<ServerActionResult<{ id: string }>> {
  try {
    if (!id) {
      return { success: false, error: "Appointment ID required", code: "INVALID_ARGUMENT" };
    }

    await adminDb.collection(COLLECTIONS.APPOINTMENTS).doc(id).update({
      status: status || "Confirmed",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, data: { id } };
  } catch (error: any) {
    console.error("[appointmentActions] Error updating appointment status:", error);
    return {
      success: false,
      error: error?.message || "Failed to update appointment status.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Update appointment fields via Admin SDK.
 * Strips any undefined fields before sending to Firestore.
 */
export async function updateAppointmentAction(
  id: string,
  data: Record<string, any>
): Promise<ServerActionResult<{ id: string }>> {
  try {
    if (!id) {
      return { success: false, error: "Appointment ID required", code: "INVALID_ARGUMENT" };
    }

    const cleanUpdates: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== "id" && key !== "createdAt") {
        cleanUpdates[key] = value;
      }
    }

    await adminDb.collection(COLLECTIONS.APPOINTMENTS).doc(id).update(cleanUpdates);

    return { success: true, data: { id } };
  } catch (error: any) {
    console.error("[appointmentActions] Error updating appointment on server:", error);
    return {
      success: false,
      error: error?.message || "Failed to update appointment.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Delete appointment via Admin SDK.
 */
export async function deleteAppointmentAction(
  id: string
): Promise<ServerActionResult<{ id: string }>> {
  try {
    if (!id) {
      return { success: false, error: "Appointment ID required", code: "INVALID_ARGUMENT" };
    }

    await adminDb.collection(COLLECTIONS.APPOINTMENTS).doc(id).delete();

    return { success: true, data: { id } };
  } catch (error: any) {
    console.error("[appointmentActions] Error deleting appointment:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete appointment.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Fetch appointments list via Admin SDK.
 */
export async function getAppointmentsAction(
  filter: string = "all"
): Promise<ServerActionResult<Appointment[]>> {
  try {
    const today = new Date().toISOString().split("T")[0];
    let q: any = adminDb.collection(COLLECTIONS.APPOINTMENTS);

    switch (filter) {
      case "today":
        q = q.where("date", "==", today).orderBy("time", "asc");
        break;
      case "upcoming":
        q = q.where("date", ">", today).orderBy("date", "asc");
        break;
      case "history":
        q = q.where("date", "<", today).orderBy("date", "desc");
        break;
      default:
        q = q.orderBy("date", "desc");
    }

    const snap = await q.get();
    const list = snap.docs.map((d: any) => serializeRecord({ id: d.id, ...d.data() }));
    return { success: true, data: list as Appointment[] };
  } catch (error: any) {
    console.error("[appointmentActions] Error fetching appointments on server:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch appointments.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Fetch single appointment by ID via Admin SDK.
 */
export async function getAppointmentByIdAction(
  id: string
): Promise<ServerActionResult<Appointment | null>> {
  try {
    if (!id) return { success: true, data: null };
    const docSnap = await adminDb.collection(COLLECTIONS.APPOINTMENTS).doc(id).get();
    if (!docSnap.exists) return { success: true, data: null };
    return {
      success: true,
      data: serializeRecord({ id: docSnap.id, ...docSnap.data() }) as Appointment,
    };
  } catch (error: any) {
    console.error("[appointmentActions] Error fetching appointment by ID:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch appointment.",
      code: "SERVER_ERROR",
    };
  }
}
