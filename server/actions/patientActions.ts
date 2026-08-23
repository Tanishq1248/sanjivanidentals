"use server";

import { adminDb } from "../../lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS, DEFAULT_CLINIC_ID } from "../../lib/services/firestoreConfig";
import type { Patient, PatientFormData, PatientEncounter, PatientMedicalProfile } from "../../lib/types";

export interface ServerActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-indigo-500",
];

function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
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
 * Server Action: Create a new patient securely via Admin SDK.
 * Bypasses client-side Firestore security rules.
 */
export async function createPatientAction(
  data: PatientFormData
): Promise<ServerActionResult<{ id: string }>> {
  try {
    const nameTrimmed = (data.name || "").trim();
    if (!nameTrimmed) {
      return {
        success: false,
        error: "Patient name is required.",
        code: "INVALID_ARGUMENT",
      };
    }

    const clinicId = (data as any).clinicId || DEFAULT_CLINIC_ID;
    const avatarColor = randomAvatarColor();

    const patientPayload = {
      ...data,
      name: nameTrimmed,
      nameLowercase: nameTrimmed.toLowerCase(),
      clinicId: clinicId || DEFAULT_CLINIC_ID,
      avatarColor,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection(COLLECTIONS.PATIENTS).add(patientPayload);

    return {
      success: true,
      data: {
        id: docRef.id,
      },
    };
  } catch (error: any) {
    console.error("[patientActions] Error creating patient on server:", error);
    return {
      success: false,
      error: error?.message || "Failed to create patient on server.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Update patient document securely via Admin SDK.
 */
export async function updatePatientAction(
  id: string,
  data: Partial<PatientFormData>
): Promise<ServerActionResult<{ id: string }>> {
  try {
    if (!id) {
      return {
        success: false,
        error: "Patient ID is required.",
        code: "INVALID_ARGUMENT",
      };
    }

    const updates: Record<string, any> = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (data.name) {
      const nameTrimmed = data.name.trim();
      updates.name = nameTrimmed;
      updates.nameLowercase = nameTrimmed.toLowerCase();
    }

    await adminDb.collection(COLLECTIONS.PATIENTS).doc(id).update(updates);

    return {
      success: true,
      data: { id },
    };
  } catch (error: any) {
    console.error("[patientActions] Error updating patient on server:", error);
    return {
      success: false,
      error: error?.message || "Failed to update patient on server.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Delete patient document securely via Admin SDK.
 */
export async function deletePatientAction(
  id: string
): Promise<ServerActionResult<{ id: string }>> {
  try {
    if (!id) {
      return {
        success: false,
        error: "Patient ID is required.",
        code: "INVALID_ARGUMENT",
      };
    }

    await adminDb.collection(COLLECTIONS.PATIENTS).doc(id).delete();

    return {
      success: true,
      data: { id },
    };
  } catch (error: any) {
    console.error("[patientActions] Error deleting patient on server:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete patient on server.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Fetch patient by ID fallback.
 */
export async function getPatientByIdAction(
  id: string
): Promise<ServerActionResult<Patient | null>> {
  try {
    if (!id) return { success: true, data: null };
    const snap = await adminDb.collection(COLLECTIONS.PATIENTS).doc(id).get();
    if (!snap.exists) return { success: true, data: null };
    return {
      success: true,
      data: serializeRecord({ id: snap.id, ...snap.data() }),
    };
  } catch (error: any) {
    console.error("[patientActions] Error getting patient by ID:", error);
    return {
      success: false,
      error: error?.message || "Failed to get patient.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Fetch all patients fallback.
 */
export async function getPatientsAction(): Promise<ServerActionResult<Patient[]>> {
  try {
    const snap = await adminDb
      .collection(COLLECTIONS.PATIENTS)
      .orderBy("createdAt", "desc")
      .get();
    const list = snap.docs.map((d) => serializeRecord({ id: d.id, ...d.data() }));
    return { success: true, data: list as Patient[] };
  } catch (error: any) {
    console.error("[patientActions] Error fetching patients on server:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch patients.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Fetch paginated patients with instant server execution and search filtering.
 */
export async function getPaginatedPatientsServerAction(options: {
  pageSize?: number;
  page?: number;
  searchTerm?: string;
} = {}): Promise<ServerActionResult<{ data: Patient[]; hasNext: boolean; totalCount: number }>> {
  try {
    const { pageSize = 20, page = 1, searchTerm = "" } = options;
    const cleanSearch = searchTerm.trim().toLowerCase();

    const snapshot = await adminDb
      .collection(COLLECTIONS.PATIENTS)
      .orderBy("createdAt", "desc")
      .get();

    let allDocs = snapshot.docs.map((d) => {
      const data = d.data();
      return serializeRecord({
        ...data,
        id: d.id,
      });
    }) as Patient[];

    if (cleanSearch) {
      allDocs = allDocs.filter((p) => {
        const nameMatch = (p.name || "").toLowerCase().includes(cleanSearch);
        const phoneMatch = (p.phone || "").replace(/\s+/g, "").includes(cleanSearch.replace(/\s+/g, ""));
        const emailMatch = (p.email || "").toLowerCase().includes(cleanSearch);
        const idMatch = (p.id || "").toLowerCase().includes(cleanSearch);
        return nameMatch || phoneMatch || emailMatch || idMatch;
      });
    }

    const totalCount = allDocs.length;
    const startIndex = (page - 1) * pageSize;
    const pageSlice = allDocs.slice(startIndex, startIndex + pageSize);
    const hasNext = startIndex + pageSize < totalCount;

    return {
      success: true,
      data: {
        data: pageSlice,
        hasNext,
        totalCount,
      },
    };
  } catch (error: any) {
    console.error("[patientActions] Error fetching paginated patients:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch paginated patients.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Get total count of patients via Admin SDK.
 */
export async function getPatientsCountServerAction(): Promise<ServerActionResult<number>> {
  try {
    const snapshot = await adminDb.collection(COLLECTIONS.PATIENTS).count().get();
    return {
      success: true,
      data: snapshot.data().count,
    };
  } catch (error: any) {
    console.error("[patientActions] Error fetching patient count:", error);
    return {
      success: false,
      error: error?.message || "Failed to count patients.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Save patient medical profile via Admin SDK.
 */
export async function savePatientMedicalProfileAction(
  patientId: string,
  profileData: Record<string, any>
): Promise<ServerActionResult<{ patientId: string }>> {
  try {
    if (!patientId) {
      return { success: false, error: "Patient ID required", code: "INVALID_ARGUMENT" };
    }

    await adminDb.collection(COLLECTIONS.PATIENT_MEDICAL_PROFILES).doc(patientId).set(
      {
        ...profileData,
        patientId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, data: { patientId } };
  } catch (error: any) {
    console.error("[patientActions] Error saving medical profile:", error);
    return {
      success: false,
      error: error?.message || "Failed to save medical profile.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Fetch patient medical profile via Admin SDK.
 */
export async function getPatientMedicalProfileAction(
  patientId: string
): Promise<ServerActionResult<PatientMedicalProfile | null>> {
  try {
    if (!patientId) return { success: true, data: null };
    const docSnap = await adminDb.collection(COLLECTIONS.PATIENT_MEDICAL_PROFILES).doc(patientId).get();
    if (!docSnap.exists) return { success: true, data: null };
    return {
      success: true,
      data: serializeRecord({ patientId, ...docSnap.data() }) as PatientMedicalProfile,
    };
  } catch (error: any) {
    console.error("[patientActions] Error fetching medical profile:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch medical profile.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Add patient encounter via Admin SDK.
 */
export async function addPatientEncounterAction(
  encounterData: Record<string, any>
): Promise<ServerActionResult<{ id: string }>> {
  try {
    const docRef = await adminDb.collection(COLLECTIONS.PATIENT_ENCOUNTERS).add({
      ...encounterData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, data: { id: docRef.id } };
  } catch (error: any) {
    console.error("[patientActions] Error adding patient encounter:", error);
    return {
      success: false,
      error: error?.message || "Failed to add encounter.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Update patient encounter via Admin SDK.
 */
export async function updatePatientEncounterAction(
  encounterId: string,
  updates: Record<string, any>
): Promise<ServerActionResult<{ id: string }>> {
  try {
    if (!encounterId) {
      return { success: false, error: "Encounter ID required", code: "INVALID_ARGUMENT" };
    }

    await adminDb.collection(COLLECTIONS.PATIENT_ENCOUNTERS).doc(encounterId).update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, data: { id: encounterId } };
  } catch (error: any) {
    console.error("[patientActions] Error updating patient encounter:", error);
    return {
      success: false,
      error: error?.message || "Failed to update encounter.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Delete patient encounter via Admin SDK.
 */
export async function deletePatientEncounterAction(
  encounterId: string
): Promise<ServerActionResult<{ id: string }>> {
  try {
    if (!encounterId) {
      return { success: false, error: "Encounter ID required", code: "INVALID_ARGUMENT" };
    }

    await adminDb.collection(COLLECTIONS.PATIENT_ENCOUNTERS).doc(encounterId).delete();

    return { success: true, data: { id: encounterId } };
  } catch (error: any) {
    console.error("[patientActions] Error deleting encounter:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete encounter.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Fetch patient encounters timeline via Admin SDK.
 */
export async function getPatientEncountersAction(
  patientId: string
): Promise<ServerActionResult<PatientEncounter[]>> {
  try {
    if (!patientId) return { success: true, data: [] };
    const snapshot = await adminDb
      .collection(COLLECTIONS.PATIENT_ENCOUNTERS)
      .where("patientId", "==", patientId)
      .get();

    const data = snapshot.docs.map((d) => serializeRecord({ id: d.id, ...d.data() }) as PatientEncounter);
    data.sort((a, b) => (b.visitDate || "").localeCompare(a.visitDate || ""));

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error("[patientActions] Error fetching patient encounters:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch encounters.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Log a tooth treatment into encounter via Admin SDK.
 * Bypasses client-side security rules completely.
 */
export async function logToothTreatmentAction(input: {
  patientId: string;
  toothNumber: number;
  treatmentData: {
    treatmentName: string;
    status: string;
    fee: number;
    notes?: string;
    surfaces?: any[];
    diagnosis?: string;
    clinicId?: string;
  };
  doctorId?: string;
  doctorName?: string;
  targetEncounterId?: string;
}): Promise<ServerActionResult<{ encounterId: string }>> {
  try {
    const {
      patientId,
      toothNumber,
      treatmentData,
      doctorId = "doc-1",
      doctorName = "Dr. Rajesh Sharma",
      targetEncounterId,
    } = input;

    if (!patientId || !toothNumber || !treatmentData?.treatmentName) {
      return {
        success: false,
        error: "Missing required treatment details",
        code: "INVALID_ARGUMENT",
      };
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;
    const displayDateStr = `${day}/${month}/${year}`;

    const treatmentEntryId = `tt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newToothTreatment = {
      id: treatmentEntryId,
      toothNumber,
      surfaces:
        treatmentData.surfaces && treatmentData.surfaces.length > 0
          ? treatmentData.surfaces
          : undefined,
      treatmentName: treatmentData.treatmentName,
      status: treatmentData.status,
      treatmentStatus: treatmentData.status || "Completed",
      billingStatus: "Unbilled",
      invoiceId: null,
      fee: treatmentData.fee || 0,
      notes: treatmentData.notes || "",
      date: displayDateStr,
      timestamp: now.toISOString(),
    };

    // 1. If targetEncounterId is explicitly provided
    if (targetEncounterId) {
      const targetRef = adminDb.collection(COLLECTIONS.PATIENT_ENCOUNTERS).doc(targetEncounterId);
      const snap = await targetRef.get();
      if (snap.exists) {
        const encounterData = snap.data();
        const existingToothTreatments = encounterData?.toothTreatments || [];
        const updatedToothTreatments = [...existingToothTreatments, newToothTreatment];

        const existingTreatments = encounterData?.treatments || [];
        const updatedTreatments = existingTreatments.includes(treatmentData.treatmentName)
          ? existingTreatments
          : [...existingTreatments, treatmentData.treatmentName];

        await targetRef.update({
          toothTreatments: updatedToothTreatments,
          treatments: updatedTreatments,
          updatedAt: FieldValue.serverTimestamp(),
          status: treatmentData.status === "Planned" ? encounterData?.status : "Completed",
        });

        return { success: true, data: { encounterId: targetEncounterId } };
      }
    }

    // 2. Query for today's encounter
    const querySnap = await adminDb
      .collection(COLLECTIONS.PATIENT_ENCOUNTERS)
      .where("patientId", "==", patientId)
      .where("visitDate", "==", todayStr)
      .limit(1)
      .get();

    if (!querySnap.empty) {
      const docSnap = querySnap.docs[0];
      const encounterId = docSnap.id;
      const encounterData = docSnap.data();

      const existingToothTreatments = encounterData.toothTreatments || [];
      const updatedToothTreatments = [...existingToothTreatments, newToothTreatment];

      const existingTreatments = encounterData.treatments || [];
      const updatedTreatments = existingTreatments.includes(treatmentData.treatmentName)
        ? existingTreatments
        : [...existingTreatments, treatmentData.treatmentName];

      await adminDb.collection(COLLECTIONS.PATIENT_ENCOUNTERS).doc(encounterId).update({
        toothTreatments: updatedToothTreatments,
        treatments: updatedTreatments,
        updatedAt: FieldValue.serverTimestamp(),
        status: treatmentData.status === "Planned" ? encounterData.status : "Completed",
      });

      return { success: true, data: { encounterId } };
    } else {
      // 3. Create a new encounter doc
      const clinicId = treatmentData.clinicId || DEFAULT_CLINIC_ID;

      const newEncounter = {
        patientId,
        doctorId,
        doctorName,
        visitDate: todayStr,
        chiefComplaint: "Dental Treatment Session",
        diagnosis: treatmentData.diagnosis || "Logged via Dental Chart",
        treatments: [treatmentData.treatmentName],
        toothTreatments: [newToothTreatment],
        prescriptionId: "",
        followUpDate: "",
        status: treatmentData.status === "Planned" ? "Pending" : "Completed",
        notes: treatmentData.notes || "Logged via Dental Chart",
        clinicId: clinicId || DEFAULT_CLINIC_ID,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const docRef = await adminDb.collection(COLLECTIONS.PATIENT_ENCOUNTERS).add(newEncounter);
      return { success: true, data: { encounterId: docRef.id } };
    }
  } catch (error: any) {
    console.error("[patientActions] Error logging tooth treatment:", error);
    return {
      success: false,
      error: error?.message || "Failed to log tooth treatment on server.",
      code: "SERVER_ERROR",
    };
  }
}
