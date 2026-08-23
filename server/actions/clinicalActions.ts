"use server";

import { adminDb } from "../../lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { COLLECTIONS } from "../../lib/services/firestoreConfig";
import crypto from "crypto";
import type { PatientEncounter } from "../../lib/types";

export interface ServerActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Server Action: Lock, cryptographically sign, and complete a clinical case paper session.
 * Prevents client-side manipulation of completed clinical histories.
 */
export async function signAndCompleteCasePaper(input: {
  encounterId: string;
  doctorName?: string;
  doctorRegistrationNo?: string;
  notes?: string;
  chiefComplaints?: string[];
}): Promise<ServerActionResult<{ signatureHash: string; signedAt: string }>> {
  try {
    const {
      encounterId,
      doctorName = "Authorized Dentist",
      doctorRegistrationNo = "",
      notes,
      chiefComplaints,
    } = input;

    if (!encounterId) {
      return {
        success: false,
        error: "Invalid encounter ID provided.",
        code: "INVALID_ARGUMENT",
      };
    }

    const encRef = adminDb.collection(COLLECTIONS.PATIENT_ENCOUNTERS).doc(encounterId);
    const snap = await encRef.get();

    if (!snap.exists) {
      return {
        success: false,
        error: "Clinical encounter not found.",
        code: "NOT_FOUND",
      };
    }

    const encData = snap.data() as PatientEncounter;

    // Check if already finalized and locked
    if ((encData as any).isLocked && encData.status === "Completed") {
      return {
        success: true,
        data: {
          signatureHash: (encData as any).signatureHash || "FINALIZED",
          signedAt: (encData as any).signedAt || new Date().toISOString(),
        },
      };
    }

    // 1. Generate Cryptographic Tamper-Evident SHA-256 Hash
    const timestampIso = new Date().toISOString();
    const payloadToSign = JSON.stringify({
      encounterId,
      patientId: encData.patientId,
      visitDate: encData.visitDate,
      treatments: encData.toothTreatments || [],
      doctorName,
      doctorRegistrationNo,
      notes: notes !== undefined ? notes : (encData.notes || ""),
      chiefComplaints: chiefComplaints || encData.chiefComplaints || [],
      timestampIso,
    });

    const signatureHash = crypto
      .createHash("sha256")
      .update(payloadToSign)
      .digest("hex");

    // 2. Commit status change and signature to Firestore
    const updatePayload: Record<string, any> = {
      status: "Completed",
      signedAt: timestampIso,
      signedBy: doctorName,
      doctorRegistrationNo: doctorRegistrationNo || (encData as any).doctorRegistrationNo || "",
      signatureHash,
      isLocked: true,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (notes !== undefined) {
      updatePayload.notes = notes;
    }
    if (chiefComplaints !== undefined) {
      updatePayload.chiefComplaints = chiefComplaints;
    }

    await encRef.update(updatePayload);

    return {
      success: true,
      data: {
        signatureHash,
        signedAt: timestampIso,
      },
    };
  } catch (error: any) {
    console.error("[clinicalActions] Error signing case paper:", error);
    return {
      success: false,
      error: error?.message || "Failed to sign case paper on server.",
      code: "SERVER_ERROR",
    };
  }
}
