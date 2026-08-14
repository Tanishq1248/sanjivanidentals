/**
 * Centralized Feature Access & Subscription Licensing Service
 *
 * Single source of truth for checking feature capabilities and plan limits
 * across frontend UI components and backend services/API routes.
 */

import type { SubscriptionPlanType, SubscriptionFeatures, ClinicSubscriptionData } from "../types";

export const PLAN_PRESETS: Record<SubscriptionPlanType, SubscriptionFeatures> = {
  basic: {
    rolePermissions: false,
    maxDoctors: 2,
    maxReceptionists: 1,
    customRoles: false,
    permissionEditing: false,
    chairManagement: true,
    advancedAnalytics: false,
    whatsappAutomation: true,
    auditLogs: false,
  },
  professional: {
    rolePermissions: true,
    maxDoctors: 4,
    maxReceptionists: 2,
    customRoles: true,
    permissionEditing: true,
    chairManagement: true,
    advancedAnalytics: true,
    whatsappAutomation: true,
    auditLogs: true,
  },
  enterprise: {
    rolePermissions: true,
    maxDoctors: 999,
    maxReceptionists: 999,
    customRoles: true,
    permissionEditing: true,
    chairManagement: true,
    advancedAnalytics: true,
    whatsappAutomation: true,
    auditLogs: true,
  },
};

export const DEFAULT_SUBSCRIPTION: ClinicSubscriptionData = {
  plan: "basic",
  status: "active",
  features: PLAN_PRESETS.basic,
};

/**
 * Get normalized subscription details from clinic settings data.
 * Defaults to Basic Plan if no subscription is configured.
 */
export function getSubscription(clinicData?: any): ClinicSubscriptionData {
  if (clinicData?.subscription) {
    const rawSub = clinicData.subscription;
    const plan: SubscriptionPlanType = rawSub.plan && PLAN_PRESETS[rawSub.plan as SubscriptionPlanType]
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
  return getSubscription(clinicData).plan;
}

/**
 * Get current plan feature flags.
 */
export function getSubscriptionFeatures(clinicData?: any): SubscriptionFeatures {
  return getSubscription(clinicData).features;
}

/**
 * Check if the clinic has access to Role & Permissions management.
 */
export function canManageRoles(clinicData?: any): boolean {
  return getSubscriptionFeatures(clinicData).rolePermissions;
}

/**
 * Check if the clinic can customize or edit permissions for roles.
 */
export function canEditPermissions(clinicData?: any): boolean {
  return getSubscriptionFeatures(clinicData).permissionEditing;
}

/**
 * Get maximum number of doctors allowed under current plan.
 */
export function getMaximumDoctors(clinicData?: any): number {
  return getSubscriptionFeatures(clinicData).maxDoctors;
}

/**
 * Check if another doctor can be added given the current doctor count.
 */
export function canAddDoctor(currentDoctorCount: number, clinicData?: any): boolean {
  const max = getMaximumDoctors(clinicData);
  return currentDoctorCount < max;
}

/**
 * Check generic feature flag availability.
 */
export function canAccessFeature(featureName: keyof SubscriptionFeatures, clinicData?: any): boolean {
  const features = getSubscriptionFeatures(clinicData);
  return Boolean(features[featureName]);
}
