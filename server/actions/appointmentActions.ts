"use server";

import { adminDb } from "../../lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { COLLECTIONS, DEFAULT_CLINIC_ID } from "../../lib/services/firestoreConfig";
import type { Appointment, AppointmentStatus } from "../../lib/types";

export interface ServerActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Server Action: Create an appointment securely via Admin SDK.
 */
export async function createAppointmentAction(
  data: Record<string, any>
): Promise<ServerActionResult<{ id: string }>> {
  try {
    const clinicId = data.clinicId || DEFAULT_CLINIC_ID;

    const payload = {
      ...data,
      clinicId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection(COLLECTIONS.APPOINTMENTS).add(payload);

    return {
      success: true,
      data: { id: docRef.id },
    };
  } catch (error: any) {
    console.error("[appointmentActions] Error creating appointment:", error);
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
      status,
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
 */
export async function updateAppointmentAction(
  id: string,
  data: Record<string, any>
): Promise<ServerActionResult<{ id: string }>> {
  try {
    if (!id) {
      return { success: false, error: "Appointment ID required", code: "INVALID_ARGUMENT" };
    }

    await adminDb.collection(COLLECTIONS.APPOINTMENTS).doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, data: { id } };
  } catch (error: any) {
    console.error("[appointmentActions] Error updating appointment:", error);
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
