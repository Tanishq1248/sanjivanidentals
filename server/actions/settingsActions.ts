"use server";

import { adminDb } from "../../lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { COLLECTIONS, DEFAULT_CLINIC_ID } from "../../lib/services/firestoreConfig";
import {
  verifyChairLimit,
  verifyDoctorLimit,
  verifyFeaturePermission,
} from "../guards/planGuard";
import type {
  ClinicResourcesData,
  TeamMemberFormData,
  AppointmentSettingsData,
} from "../../lib/types";

export interface ServerActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Server Action: Save clinic resources (Chairs) with server-side plan limit enforcement.
 */
export async function saveClinicResourcesAction(
  resources: ClinicResourcesData,
  clinicId: string = DEFAULT_CLINIC_ID
): Promise<ServerActionResult<ClinicResourcesData>> {
  try {
    const chairCount = resources.chairs?.length ?? resources.chairCount ?? 1;

    // Server-side Plan Guard check
    const guard = await verifyChairLimit(clinicId, chairCount);
    if (!guard.allowed) {
      return {
        success: false,
        error: guard.reason || "Chair limit exceeded for current subscription plan.",
        code: guard.code || "PLAN_LIMIT_EXCEEDED",
      };
    }

    const docRef = adminDb.collection(COLLECTIONS.CLINIC_SETTINGS).doc("resources");
    await docRef.set({
      ...resources,
      chairCount,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      data: {
        ...resources,
        chairCount,
      },
    };
  } catch (error: any) {
    console.error("[settingsActions] Error saving clinic resources:", error);
    return {
      success: false,
      error: error?.message || "Failed to save clinic resources on server.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Add a team member with server-side doctor quota enforcement.
 */
export async function addTeamMemberAction(
  memberData: TeamMemberFormData,
  clinicId: string = DEFAULT_CLINIC_ID
): Promise<ServerActionResult<{ id: string }>> {
  try {
    const isDoctor =
      memberData.role?.toLowerCase() === "doctor" ||
      memberData.roleId === "role-doctor";

    if (isDoctor) {
      const guard = await verifyDoctorLimit(clinicId);
      if (!guard.allowed) {
        return {
          success: false,
          error: guard.reason || "Active doctor quota exceeded for current subscription plan.",
          code: guard.code || "PLAN_LIMIT_EXCEEDED",
        };
      }
    }

    const docRef = await adminDb.collection(COLLECTIONS.TEAM_MEMBERS).add({
      ...memberData,
      clinicId: clinicId || DEFAULT_CLINIC_ID,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      data: {
        id: docRef.id,
      },
    };
  } catch (error: any) {
    console.error("[settingsActions] Error adding team member:", error);
    return {
      success: false,
      error: error?.message || "Failed to add team member on server.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Save appointment settings with server-side advanced rules verification.
 */
export async function saveAppointmentSettingsAction(
  settings: AppointmentSettingsData,
  clinicId: string = DEFAULT_CLINIC_ID
): Promise<ServerActionResult<AppointmentSettingsData>> {
  try {
    // Check if advanced rules are configured
    const hasAdvanced =
      Boolean((settings as any).automatedBufferTimes) ||
      Boolean((settings as any).chairSpecificRules) ||
      Boolean((settings as any).overbookingPrevention);

    if (hasAdvanced) {
      const guard = await verifyFeaturePermission("advancedAppointmentRules", clinicId);
      if (!guard.allowed) {
        return {
          success: false,
          error: guard.reason || "Advanced appointment scheduling rules require a Professional Plan.",
          code: guard.code || "FEATURE_LOCKED",
        };
      }
    }

    const docRef = adminDb.collection(COLLECTIONS.APPOINTMENT_SETTINGS).doc("global");
    await docRef.set({
      ...settings,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      data: settings,
    };
  } catch (error: any) {
    console.error("[settingsActions] Error saving appointment settings:", error);
    return {
      success: false,
      error: error?.message || "Failed to save appointment settings on server.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Save clinic basic info across all standard documents via Admin SDK.
 * Overcomes client Firestore permission errors.
 */
export async function saveClinicInfoAction(
  data: Record<string, any>,
  clinicId: string = DEFAULT_CLINIC_ID
): Promise<ServerActionResult<Record<string, any>>> {
  try {
    const updatePayload = {
      ...data,
      clinicId: clinicId || DEFAULT_CLINIC_ID,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Synchronize to primary and fallback documents
    const batch = adminDb.batch();
    const colRef = adminDb.collection(COLLECTIONS.CLINIC_SETTINGS);

    batch.set(colRef.doc("basicInfo"), updatePayload, { merge: true });
    batch.set(colRef.doc("info"), updatePayload, { merge: true });
    batch.set(colRef.doc("default"), updatePayload, { merge: true });
    batch.set(colRef.doc("general"), updatePayload, { merge: true });

    await batch.commit();

    return {
      success: true,
      data: {
        ...data,
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error("[settingsActions] Error saving clinic info on server:", error);
    return {
      success: false,
      error: error?.message || "Failed to save clinic information on server.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Update team member via Admin SDK.
 */
export async function updateTeamMemberAction(
  id: string,
  updates: Record<string, any>
): Promise<ServerActionResult<{ id: string }>> {
  try {
    if (!id) {
      return { success: false, error: "Team member ID required", code: "INVALID_ARGUMENT" };
    }

    await adminDb.collection(COLLECTIONS.TEAM_MEMBERS).doc(id).update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, data: { id } };
  } catch (error: any) {
    console.error("[settingsActions] Error updating team member:", error);
    return {
      success: false,
      error: error?.message || "Failed to update team member.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Delete team member via Admin SDK.
 */
export async function deleteTeamMemberAction(
  id: string
): Promise<ServerActionResult<{ id: string }>> {
  try {
    if (!id) {
      return { success: false, error: "Team member ID required", code: "INVALID_ARGUMENT" };
    }

    await adminDb.collection(COLLECTIONS.TEAM_MEMBERS).doc(id).delete();

    return { success: true, data: { id } };
  } catch (error: any) {
    console.error("[settingsActions] Error deleting team member:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete team member.",
      code: "SERVER_ERROR",
    };
  }
}
