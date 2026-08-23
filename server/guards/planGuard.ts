import { adminDb } from "../../lib/firebaseAdmin";
import { COLLECTIONS, DEFAULT_CLINIC_ID } from "../../lib/services/firestoreConfig";
import {
  FeatureAccessService,
  getSubscription,
  PLAN_PRESETS,
  type ClinicSubscriptionFeatures,
} from "../../lib/services/featureAccessService";
import type { ClinicSettingsData } from "../../lib/types";

export interface PlanGuardResult {
  allowed: boolean;
  reason?: string;
  code?: "PLAN_LIMIT_EXCEEDED" | "FEATURE_LOCKED" | "UNAUTHORIZED" | "OK";
  currentCount?: number;
  maxAllowed?: number;
  features?: ClinicSubscriptionFeatures;
}

/**
 * Fetch clinic settings and features directly from the server database (Admin SDK).
 * Guarantees zero reliance on client-submitted subscription values.
 */
export async function getServerClinicFeatures(
  clinicId: string = DEFAULT_CLINIC_ID
): Promise<{ features: ClinicSubscriptionFeatures; clinicData: ClinicSettingsData | null }> {
  try {
    const docSnap = await adminDb
      .collection(COLLECTIONS.CLINIC_SETTINGS)
      .doc(clinicId)
      .get();

    if (!docSnap.exists) {
      // Return Basic Plan default
      return {
        features: PLAN_PRESETS.basic,
        clinicData: null,
      };
    }

    const clinicData = docSnap.data() as ClinicSettingsData;
    const features = FeatureAccessService.getFeatures(clinicData);
    return { features, clinicData };
  } catch (error) {
    console.error("[planGuard] Error fetching server clinic features:", error);
    return {
      features: PLAN_PRESETS.basic,
      clinicData: null,
    };
  }
}

/**
 * Server Guard: Verify chair quota before adding chairs.
 */
export async function verifyChairLimit(
  clinicId: string = DEFAULT_CLINIC_ID,
  requestedChairCount?: number
): Promise<PlanGuardResult> {
  const { features } = await getServerClinicFeatures(clinicId);
  const maxChairs = FeatureAccessService.getMaximumChairs(features);

  // If specific count is requested to be set
  if (requestedChairCount !== undefined) {
    if (requestedChairCount > maxChairs) {
      return {
        allowed: false,
        code: "PLAN_LIMIT_EXCEEDED",
        reason: `Your ${features.plan.toUpperCase()} Plan allows up to ${maxChairs} dental chairs. Requested: ${requestedChairCount}. Please upgrade to Professional to add more chairs.`,
        currentCount: requestedChairCount,
        maxAllowed: maxChairs,
        features,
      };
    }
    return { allowed: true, code: "OK", features, maxAllowed: maxChairs };
  }

  // Count existing chairs in clinicSettings/resources or collection
  const resourcesDoc = await adminDb
    .collection(COLLECTIONS.CLINIC_SETTINGS)
    .doc("resources")
    .get();

  let currentCount = 0;
  if (resourcesDoc.exists) {
    const data = resourcesDoc.data();
    currentCount = data?.chairs?.length ?? data?.chairCount ?? 0;
  }

  const canAdd = FeatureAccessService.canAddMoreChairs(currentCount, features);
  if (!canAdd) {
    return {
      allowed: false,
      code: "PLAN_LIMIT_EXCEEDED",
      reason: `Your ${features.plan.toUpperCase()} Plan limit of ${maxChairs} chairs has been reached. Please upgrade to Professional to add more chairs.`,
      currentCount,
      maxAllowed: maxChairs,
      features,
    };
  }

  return {
    allowed: true,
    code: "OK",
    currentCount,
    maxAllowed: maxChairs,
    features,
  };
}

/**
 * Server Guard: Verify doctor quota before adding team doctors.
 */
export async function verifyDoctorLimit(
  clinicId: string = DEFAULT_CLINIC_ID
): Promise<PlanGuardResult> {
  const { features } = await getServerClinicFeatures(clinicId);
  const maxDoctors = FeatureAccessService.getMaximumDoctors(features);

  // Query active doctors from teamMembers
  const teamSnap = await adminDb
    .collection(COLLECTIONS.TEAM_MEMBERS)
    .get();

  const currentDoctorCount = teamSnap.docs.filter((d: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = d.data();
    return (
      (data.status === "Active" || !data.status) &&
      (data.role?.toLowerCase() === "doctor" || data.roleId === "role-doctor")
    );
  }).length;

  const canAdd = FeatureAccessService.canAddDoctor(currentDoctorCount, features);
  if (!canAdd) {
    return {
      allowed: false,
      code: "PLAN_LIMIT_EXCEEDED",
      reason: `Your ${features.plan.toUpperCase()} Plan allows up to ${maxDoctors} active doctors. Currently active: ${currentDoctorCount}. Please upgrade to Professional to add more doctors.`,
      currentCount: currentDoctorCount,
      maxAllowed: maxDoctors,
      features,
    };
  }

  return {
    allowed: true,
    code: "OK",
    currentCount: currentDoctorCount,
    maxAllowed: maxDoctors,
    features,
  };
}

/**
 * Server Guard: Verify feature capability permission.
 */
export async function verifyFeaturePermission(
  feature: keyof ClinicSubscriptionFeatures,
  clinicId: string = DEFAULT_CLINIC_ID
): Promise<PlanGuardResult> {
  const { features } = await getServerClinicFeatures(clinicId);
  const isAllowed = Boolean(features[feature]);

  if (!isAllowed) {
    return {
      allowed: false,
      code: "FEATURE_LOCKED",
      reason: `Feature '${String(feature)}' is locked on the ${features.plan.toUpperCase()} Plan. Upgrade to Professional or Enterprise to unlock this feature.`,
      features,
    };
  }

  return {
    allowed: true,
    code: "OK",
    features,
  };
}
