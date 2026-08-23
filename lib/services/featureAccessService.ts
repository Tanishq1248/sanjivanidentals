/**
 * Centralized Feature Access & Subscription Licensing Service
 *
 * Single source of truth for checking feature capabilities and plan limits
 * across frontend UI components and backend services/API routes.
 */

import type {
  SubscriptionPlanType,
  ClinicSubscriptionFeatures,
  ClinicSubscriptionData,
} from "../types";

export type { ClinicSubscriptionFeatures };

export const PLAN_PRESETS: Record<SubscriptionPlanType, ClinicSubscriptionFeatures> = {
  basic: {
    plan: "basic",
    maxDoctors: 2,
    maxChairs: 2,
    customMessageTemplates: false,
    advancedAppointmentRules: false,
    twoFactorAuth: false,
    auditLogs: false,
    bulkDataExport: false,
    rolePermissions: false,
    maxReceptionists: 1,
    customRoles: false,
    permissionEditing: false,
    chairManagement: true,
    advancedAnalytics: false,
    whatsappAutomation: true,
  },
  professional: {
    plan: "professional",
    maxDoctors: 10,
    maxChairs: 10,
    customMessageTemplates: true,
    advancedAppointmentRules: true,
    twoFactorAuth: true,
    auditLogs: true,
    bulkDataExport: true,
    rolePermissions: true,
    maxReceptionists: 5,
    customRoles: true,
    permissionEditing: true,
    chairManagement: true,
    advancedAnalytics: true,
    whatsappAutomation: true,
  },
  enterprise: {
    plan: "enterprise",
    maxDoctors: 999,
    maxChairs: 999,
    customMessageTemplates: true,
    advancedAppointmentRules: true,
    twoFactorAuth: true,
    auditLogs: true,
    bulkDataExport: true,
    rolePermissions: true,
    maxReceptionists: 999,
    customRoles: true,
    permissionEditing: true,
    chairManagement: true,
    advancedAnalytics: true,
    whatsappAutomation: true,
  },
};

export const DEFAULT_SUBSCRIPTION: ClinicSubscriptionData = {
  plan: "basic",
  status: "active",
  features: PLAN_PRESETS.basic,
};

/**
 * Normalizes input: if clinic object or subscription object is passed, extracts features;
 * if features object itself is passed, returns it; otherwise returns basic preset.
 */
function resolveFeatures(input?: any): ClinicSubscriptionFeatures {
  if (!input) return PLAN_PRESETS.basic;
  // If input is already features (has plan or maxChairs)
  if (input.maxChairs !== undefined && input.plan) {
    const base = PLAN_PRESETS[input.plan as SubscriptionPlanType] || PLAN_PRESETS.basic;
    return { ...base, ...input };
  }
  // If input is clinicInfo or subscription data
  return getSubscriptionFeatures(input);
}

/**
 * Get normalized subscription details from clinic settings data.
 * Defaults to Basic Plan if no subscription is configured.
 */
export function getSubscription(clinicData?: any): ClinicSubscriptionData {
  if (clinicData?.subscription) {
    const rawSub = clinicData.subscription;
    const plan: SubscriptionPlanType =
      rawSub.plan && PLAN_PRESETS[rawSub.plan as SubscriptionPlanType]
        ? (rawSub.plan as SubscriptionPlanType)
        : "basic";

    return {
      plan,
      status: rawSub.status || "active",
      features: {
        ...PLAN_PRESETS[plan],
        ...(rawSub.features || {}),
      },
    };
  }

  return DEFAULT_SUBSCRIPTION;
}

/**
 * Get current subscription plan type ("basic" | "professional" | "enterprise").
 */
export function getPlan(clinicData?: any): SubscriptionPlanType {
  if (clinicData?.plan && PLAN_PRESETS[clinicData.plan as SubscriptionPlanType]) {
    return clinicData.plan as SubscriptionPlanType;
  }
  return getSubscription(clinicData).plan;
}

/**
 * Get current plan feature flags.
 */
export function getSubscriptionFeatures(clinicData?: any): ClinicSubscriptionFeatures {
  return getSubscription(clinicData).features;
}

/**
 * Static FeatureAccessService class implementing the single source of truth for feature access rules.
 */
export class FeatureAccessService {
  // Helper to resolve features
  static getFeatures(input?: any): ClinicSubscriptionFeatures {
    return resolveFeatures(input);
  }

  static getPlan(input?: any): SubscriptionPlanType {
    return getPlan(input);
  }

  // Chair Restrictions (Basic: 2, Pro: 10+)
  static getMaximumChairs(features?: ClinicSubscriptionFeatures | any): number {
    const f = resolveFeatures(features);
    return f?.maxChairs ?? 2;
  }

  static canAddMoreChairs(currentCount: number, features?: ClinicSubscriptionFeatures | any): boolean {
    return currentCount < this.getMaximumChairs(features);
  }

  // Template Restrictions (Basic: false, Pro: true)
  static canEditCustomTemplates(features?: ClinicSubscriptionFeatures | any): boolean {
    const f = resolveFeatures(features);
    return f?.customMessageTemplates ?? false;
  }

  // Appointment Customizations (Basic: false, Pro: true)
  static canUseAdvancedAppointmentRules(features?: ClinicSubscriptionFeatures | any): boolean {
    const f = resolveFeatures(features);
    return f?.advancedAppointmentRules ?? false;
  }

  // Security & Audits (Basic: false, Pro: true)
  static canUseTwoFactorAuth(features?: ClinicSubscriptionFeatures | any): boolean {
    const f = resolveFeatures(features);
    return f?.twoFactorAuth ?? false;
  }

  static canViewAuditLogs(features?: ClinicSubscriptionFeatures | any): boolean {
    const f = resolveFeatures(features);
    return f?.auditLogs ?? false;
  }

  // Backup & Export (Basic: false, Pro: true)
  static canExportBulkData(features?: ClinicSubscriptionFeatures | any): boolean {
    const f = resolveFeatures(features);
    return f?.bulkDataExport ?? false;
  }

  // Doctor Restrictions (Basic: 2, Pro: 10+)
  static getMaximumDoctors(features?: ClinicSubscriptionFeatures | any): number {
    const f = resolveFeatures(features);
    return f?.maxDoctors ?? 2;
  }

  static canAddDoctor(currentDoctorCount: number, features?: ClinicSubscriptionFeatures | any): boolean {
    return currentDoctorCount < this.getMaximumDoctors(features);
  }

  // Roles & Permissions (Basic: false, Pro: true)
  static canManageRoles(features?: ClinicSubscriptionFeatures | any): boolean {
    const f = resolveFeatures(features);
    return f?.rolePermissions ?? false;
  }

  static canEditPermissions(features?: ClinicSubscriptionFeatures | any): boolean {
    const f = resolveFeatures(features);
    return f?.permissionEditing ?? false;
  }

  // Generic feature access
  static canAccessFeature(featureName: keyof ClinicSubscriptionFeatures, features?: ClinicSubscriptionFeatures | any): boolean {
    const f = resolveFeatures(features);
    return Boolean(f[featureName]);
  }
}

// ── Functional export wrappers for backwards compatibility ──

export function getMaximumChairs(clinicData?: any): number {
  return FeatureAccessService.getMaximumChairs(clinicData);
}

export function canAddMoreChairs(currentCount: number, clinicData?: any): boolean {
  return FeatureAccessService.canAddMoreChairs(currentCount, clinicData);
}

export function canEditCustomTemplates(clinicData?: any): boolean {
  return FeatureAccessService.canEditCustomTemplates(clinicData);
}

export function canUseAdvancedAppointmentRules(clinicData?: any): boolean {
  return FeatureAccessService.canUseAdvancedAppointmentRules(clinicData);
}

export function canUseTwoFactorAuth(clinicData?: any): boolean {
  return FeatureAccessService.canUseTwoFactorAuth(clinicData);
}

export function canViewAuditLogs(clinicData?: any): boolean {
  return FeatureAccessService.canViewAuditLogs(clinicData);
}

export function canExportBulkData(clinicData?: any): boolean {
  return FeatureAccessService.canExportBulkData(clinicData);
}

export function canManageRoles(clinicData?: any): boolean {
  return FeatureAccessService.canManageRoles(clinicData);
}

export function canEditPermissions(clinicData?: any): boolean {
  return FeatureAccessService.canEditPermissions(clinicData);
}

export function getMaximumDoctors(clinicData?: any): number {
  return FeatureAccessService.getMaximumDoctors(clinicData);
}

export function canAddDoctor(currentDoctorCount: number, clinicData?: any): boolean {
  return FeatureAccessService.canAddDoctor(currentDoctorCount, clinicData);
}

export function canAccessFeature(
  featureName: keyof ClinicSubscriptionFeatures,
  clinicData?: any
): boolean {
  return FeatureAccessService.canAccessFeature(featureName, clinicData);
}
