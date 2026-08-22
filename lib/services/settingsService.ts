import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { TeamMember, RolePermission, ClinicSettingsData, ClinicBasicInfo, AppointmentSettingsData, BillingSettingsData, TeamMemberFormData, MemberStatus, ChairItem, ClinicResourcesData, SubscriptionPlanType } from "../types";
import { COLLECTIONS, DEFAULT_CLINIC_ID } from "./firestoreConfig";
import { canAddDoctor, getMaximumDoctors, canEditPermissions, PLAN_PRESETS, DEFAULT_SUBSCRIPTION } from "./featureAccessService";

const ROLES_COLLECTION = COLLECTIONS.ROLES;
const CLINIC_SETTINGS_COLLECTION = COLLECTIONS.CLINIC_SETTINGS;

const INITIAL_ROLES: RolePermission[] = [
  {
    id: "role-admin",
    name: "Admin",
    description: "Full, unrestricted administrative access across all modules, finances, team roles, and system settings.",
    memberCount: 1,
    permissionCount: 45,
    isSystem: true,
    permissions: {
      Dashboard: ["View Dashboard", "View Analytics", "Export Summary"],
      Patients: ["View Patients", "Add Patient", "Edit Patient", "Delete Patient", "Export Data"],
      Appointments: ["View Appointments", "Create Appointment", "Reschedule", "Cancel Appointment"],
      Treatments: ["View Treatments", "Add Dental Chart", "Edit Dental Chart", "Delete Dental Chart"],
      Billing: ["View Invoices", "Create Invoice", "Apply Discount", "Process Payment", "Refund Invoice"],
      Prescriptions: ["View Prescriptions", "Create Prescription", "Print Prescription"],
      Reports: ["View Financial Reports", "View Patient Reports", "Export Reports"],
      Inventory: ["View Stock", "Add Stock", "Adjust Quantity", "Manage Suppliers"],
      Settings: ["View Settings", "Manage Clinic Info", "Manage Team", "Manage Roles & Permissions"],
    },
  },
  {
    id: "role-doctor",
    name: "Doctor",
    description: "Clinical access to patients, dental charts, treatments, prescriptions, and appointments.",
    memberCount: 2,
    permissionCount: 28,
    isSystem: false,
    permissions: {
      Dashboard: ["View Dashboard", "View Analytics"],
      Patients: ["View Patients", "Add Patient", "Edit Patient", "Export Data"],
      Appointments: ["View Appointments", "Create Appointment", "Reschedule", "Cancel Appointment"],
      Treatments: ["View Treatments", "Add Dental Chart", "Edit Dental Chart", "Delete Dental Chart"],
      Billing: ["View Invoices", "Create Invoice"],
      Prescriptions: ["View Prescriptions", "Create Prescription", "Print Prescription"],
      Reports: ["View Patient Reports"],
      Inventory: ["View Stock"],
      Settings: ["View Settings"],
    },
  },
  {
    id: "role-receptionist",
    name: "Receptionist",
    description: "Front-desk access for booking appointments, managing patient check-ins, and generating invoices.",
    memberCount: 1,
    permissionCount: 16,
    isSystem: false,
    permissions: {
      Dashboard: ["View Dashboard"],
      Patients: ["View Patients", "Add Patient", "Edit Patient"],
      Appointments: ["View Appointments", "Create Appointment", "Reschedule", "Cancel Appointment"],
      Treatments: ["View Treatments"],
      Billing: ["View Invoices", "Create Invoice", "Process Payment"],
      Prescriptions: ["View Prescriptions", "Print Prescription"],
      Reports: [],
      Inventory: ["View Stock"],
      Settings: [],
    },
  },
];

import {
  DEFAULT_CLINIC_SETTINGS,
  DEFAULT_CLINIC_BASIC_INFO,
  DEFAULT_CLINIC_ADDRESS,
  getClinicSettings,
  updateClinicSettings,
  getClinicInfo,
  createOrUpdateClinicInfo,
  validateClinicInfo,
  validateClinicSettings,
  formatClinicAddress,
  getDoctorCredentials,
} from "./clinicSettingsService";

export {
  DEFAULT_CLINIC_SETTINGS,
  DEFAULT_CLINIC_BASIC_INFO,
  DEFAULT_CLINIC_ADDRESS,
  getClinicSettings,
  updateClinicSettings,
  getClinicInfo,
  createOrUpdateClinicInfo,
  validateClinicInfo,
  validateClinicSettings,
  formatClinicAddress,
  getDoctorCredentials,
};

import {
  MEMBERS_COLLECTION,
  INITIAL_MEMBERS,
  validateTeamMember,
  getTeamMembers,
  getTeamMembersByRole,
  getActiveDoctors,
  addTeamMember,
  updateTeamMember,
  toggleTeamMemberStatus,
  deleteTeamMember,
  resetMemberPassword,
} from "./teamService";

export {
  MEMBERS_COLLECTION,
  INITIAL_MEMBERS,
  validateTeamMember,
  getTeamMembers,
  getTeamMembersByRole,
  getActiveDoctors,
  addTeamMember,
  updateTeamMember,
  toggleTeamMemberStatus,
  deleteTeamMember,
  resetMemberPassword,
};

// In-memory cache fallback to ensure instant UI response if Firestore latency occurs
let memoryRolesCache: RolePermission[] = [...INITIAL_ROLES];

/* ─── Roles & Permissions Services ─── */
export async function getRoles(): Promise<RolePermission[]> {
  try {
    const snap = await getDocs(collection(db, ROLES_COLLECTION));
    if (snap.empty) {
      return memoryRolesCache;
    }
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RolePermission);
    memoryRolesCache = list;
    return list;
  } catch (error) {
    console.warn("Firestore fetch error for roles, using cache fallback:", error);
    return memoryRolesCache;
  }
}

export async function addRole(roleData: Omit<RolePermission, "id" | "memberCount" | "permissionCount">): Promise<RolePermission> {
  // Backend validation: Check Role & Permission editing feature flag
  const clinicInfo = await getClinicInfo();
  if (!canEditPermissions(clinicInfo)) {
    throw new Error("Role & Permission management is available only in the Professional Plan.");
  }

  let count = 0;
  Object.values(roleData.permissions).forEach((perms) => {
    count += perms.length;
  });

  const newRole: RolePermission = {
    id: `role-${Date.now()}`,
    ...roleData,
    memberCount: 0,
    permissionCount: count,
    isSystem: false,
  };

  const clinicId = (roleData as any).clinicId;

  try {
    const docRef = await addDoc(collection(db, ROLES_COLLECTION), {
      ...roleData,
      memberCount: 0,
      permissionCount: count,
      isSystem: false,
      clinicId: clinicId || "",
      createdAt: Timestamp.now(),
    });
    newRole.id = docRef.id;
  } catch (error) {
    console.warn("Firestore write error for role:", error);
  }

  memoryRolesCache = [...memoryRolesCache, newRole];
  return newRole;
}

export async function updateRole(id: string, updates: Partial<RolePermission>): Promise<void> {
  // Backend validation: Check Role & Permission editing feature flag
  const clinicInfo = await getClinicInfo();
  if (!canEditPermissions(clinicInfo)) {
    throw new Error("Role & Permission management is available only in the Professional Plan.");
  }

  if (updates.permissions) {
    let count = 0;
    Object.values(updates.permissions).forEach((perms) => {
      count += perms.length;
    });
    updates.permissionCount = count;
  }

  try {
    await updateDoc(doc(db, ROLES_COLLECTION, id), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn("Firestore update error for role:", error);
  }

  memoryRolesCache = memoryRolesCache.map((r) => (r.id === id ? { ...r, ...updates } : r));
}

export async function deleteRole(id: string): Promise<void> {
  // Backend validation: Check Role & Permission editing feature flag
  const clinicInfo = await getClinicInfo();
  if (!canEditPermissions(clinicInfo)) {
    throw new Error("Role & Permission management is available only in the Professional Plan.");
  }

  try {
    await deleteDoc(doc(db, ROLES_COLLECTION, id));
  } catch (error) {
    console.warn("Firestore delete error for role:", error);
  }

  memoryRolesCache = memoryRolesCache.filter((r) => r.id !== id);
}

/**
 * Update clinic subscription plan (e.g. "basic" or "professional").
 */
export async function updateSubscriptionPlan(plan: SubscriptionPlanType): Promise<ClinicBasicInfo> {
  const currentInfo = await getClinicInfo();
  const newSub = {
    plan,
    status: "active" as const,
    features: PLAN_PRESETS[plan],
  };
  return createOrUpdateClinicInfo({ subscription: newSub });
}



/* ─── Appointment Settings Services ─── */

export const DEFAULT_APPOINTMENT_SETTINGS: AppointmentSettingsData = {
  defaultSlotDurationMinutes: 30,
  bufferTimeMinutes: 10,
  autoConfirmWebBookings: true,
  allowChairOverbooking: false,
};

let memoryAppointmentSettingsCache: AppointmentSettingsData = { ...DEFAULT_APPOINTMENT_SETTINGS };

/**
 * Validate appointment schedule settings payload.
 */
export function validateAppointmentSettings(data: Partial<AppointmentSettingsData>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (data.defaultSlotDurationMinutes !== undefined) {
    if (typeof data.defaultSlotDurationMinutes !== "number" || isNaN(data.defaultSlotDurationMinutes) || data.defaultSlotDurationMinutes <= 0) {
      errors.defaultSlotDurationMinutes = "Default slot duration must be a positive number";
    }
  }

  if (data.bufferTimeMinutes !== undefined) {
    if (typeof data.bufferTimeMinutes !== "number" || isNaN(data.bufferTimeMinutes) || data.bufferTimeMinutes < 0) {
      errors.bufferTimeMinutes = "Buffer time must be a non-negative number";
    }
  }

  if (data.autoConfirmWebBookings !== undefined && typeof data.autoConfirmWebBookings !== "boolean") {
    errors.autoConfirmWebBookings = "Auto-confirm web bookings must be a boolean";
  }

  if (data.allowChairOverbooking !== undefined && typeof data.allowChairOverbooking !== "boolean") {
    errors.allowChairOverbooking = "Allow chair overbooking must be a boolean";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Fetch singleton appointment settings document (appointmentSettings/info).
 */
export async function getAppointmentSettings(): Promise<AppointmentSettingsData> {
  try {
    const docRef = doc(db, COLLECTIONS.APPOINTMENT_SETTINGS, "info");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as AppointmentSettingsData;
      const merged = { ...DEFAULT_APPOINTMENT_SETTINGS, ...data };
      memoryAppointmentSettingsCache = merged;
      return merged;
    }
  } catch (error) {
    console.warn("Firestore fetch error for appointment settings:", error);
  }

  return memoryAppointmentSettingsCache;
}

/**
 * Create or update singleton appointment settings document (appointmentSettings/info).
 */
export async function createOrUpdateAppointmentSettings(
  data: Partial<AppointmentSettingsData>
): Promise<AppointmentSettingsData> {
  const current = await getAppointmentSettings();
  const clinicId = data.clinicId || current.clinicId;

  const updated: AppointmentSettingsData = {
    ...current,
    ...data,
    clinicId: clinicId || "",
    updatedAt: Timestamp.now(),
  };

  if (!current.createdAt) {
    updated.createdAt = Timestamp.now();
  }

  memoryAppointmentSettingsCache = updated;

  try {
    const docRef = doc(db, COLLECTIONS.APPOINTMENT_SETTINGS, "info");
    await setDoc(docRef, updated, { merge: true });
  } catch (error) {
    console.warn("Firestore setDoc error for appointment settings:", error);
  }

  return updated;
}

/* ─── Billing Settings Services ─── */

export const DEFAULT_BILLING_SETTINGS: BillingSettingsData = {
  invoiceNumberPrefix: "DP-INV-",
  nextInvoiceNumber: 1001,
  defaultGstRate: 18,
  systemCurrency: "INR",
  currencySymbol: "₹",
  taxIncludedMode: false,
  invoiceFooterText: "Thank you for choosing Sanjivani Dentals.",
  paymentInstructions: "Pay via UPI / Card / Cash at reception or NEFT/Bank Transfer.",
};

let memoryBillingSettingsCache: BillingSettingsData = { ...DEFAULT_BILLING_SETTINGS };

/**
 * Validate billing settings payload.
 */
export function validateBillingSettings(data: Partial<BillingSettingsData>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (data.invoiceNumberPrefix !== undefined) {
    if (!data.invoiceNumberPrefix || !data.invoiceNumberPrefix.trim()) {
      errors.invoiceNumberPrefix = "Invoice number prefix is required";
    }
  }

  if (data.nextInvoiceNumber !== undefined) {
    if (typeof data.nextInvoiceNumber !== "number" || isNaN(data.nextInvoiceNumber) || data.nextInvoiceNumber <= 0) {
      errors.nextInvoiceNumber = "Next invoice number must be a valid positive integer";
    }
  }

  if (data.defaultGstRate !== undefined) {
    if (typeof data.defaultGstRate !== "number" || isNaN(data.defaultGstRate) || data.defaultGstRate < 0 || data.defaultGstRate > 100) {
      errors.defaultGstRate = "Default GST rate must be a percentage between 0 and 100";
    }
  }

  if (data.systemCurrency !== undefined) {
    if (!data.systemCurrency || !data.systemCurrency.trim()) {
      errors.systemCurrency = "System currency is required";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Fetch singleton billing settings document (billingSettings/info).
 */
export async function getBillingSettings(): Promise<BillingSettingsData> {
  try {
    const docRef = doc(db, COLLECTIONS.BILLING_SETTINGS, "info");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as BillingSettingsData;
      const merged = { ...DEFAULT_BILLING_SETTINGS, ...data };
      memoryBillingSettingsCache = merged;
      return merged;
    }
  } catch (error) {
    console.warn("Firestore fetch error for billing settings:", error);
  }

  return memoryBillingSettingsCache;
}

/**
 * Create or update singleton billing settings document (billingSettings/info).
 */
export async function createOrUpdateBillingSettings(
  data: Partial<BillingSettingsData>
): Promise<BillingSettingsData> {
  const current = await getBillingSettings();
  const clinicId = data.clinicId || current.clinicId;

  const updated: BillingSettingsData = {
    ...current,
    ...data,
    clinicId: clinicId || "",
    updatedAt: Timestamp.now(),
  };

  if (!current.createdAt) {
    updated.createdAt = Timestamp.now();
  }

  memoryBillingSettingsCache = updated;

  try {
    const docRef = doc(db, COLLECTIONS.BILLING_SETTINGS, "info");
    await setDoc(docRef, updated, { merge: true });
  } catch (error) {
    console.warn("Firestore setDoc error for billing settings:", error);
  }

  return updated;
}

/**
 * Helper: Generate formatted next invoice number string e.g., "DP-INV-1001"
 */
export async function getNextInvoiceNumberFormatted(): Promise<string> {
  const settings = await getBillingSettings();
  const prefix = settings.invoiceNumberPrefix || "DP-INV-";
  const num = settings.nextInvoiceNumber || 1001;
  return `${prefix}${num}`;
}

/**
 * Helper: Atomically increment next invoice number counter after generating an invoice
 */
export async function incrementInvoiceNumber(): Promise<number> {
  const settings = await getBillingSettings();
  const nextNum = (settings.nextInvoiceNumber || 1000) + 1;
  await createOrUpdateBillingSettings({ nextInvoiceNumber: nextNum });
  return nextNum;
}

/* ─── Clinic Resources (Chair Management) Services ─── */

export const DEFAULT_CLINIC_RESOURCES: ClinicResourcesData = {
  chairCount: 1,
  chairs: [
    { id: "chair-1", name: "Chair 1", active: true },
  ],
};

let memoryClinicResourcesCache: ClinicResourcesData = { ...DEFAULT_CLINIC_RESOURCES };

/**
 * Validate clinic resources (chairs) payload.
 * Rules:
 * - Chair count must be between 1 and 4.
 * - Chair names cannot be empty.
 * - Chair names must be unique (case-insensitive, trimmed).
 */
export function validateClinicResources(data: Partial<ClinicResourcesData>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (data.chairCount !== undefined) {
    if (typeof data.chairCount !== "number" || isNaN(data.chairCount) || data.chairCount < 1 || data.chairCount > 4) {
      errors.chairCount = "Number of chairs must be between 1 and 4";
    }
  }

  if (data.chairs && Array.isArray(data.chairs)) {
    const seenNames = new Set<string>();

    data.chairs.forEach((c, idx) => {
      const trimmedName = (c.name || "").trim();
      if (!trimmedName) {
        errors[`chair_${idx}`] = `Chair ${idx + 1} name cannot be empty`;
      } else {
        const lower = trimmedName.toLowerCase();
        if (seenNames.has(lower)) {
          errors[`chair_${idx}`] = `Chair name "${trimmedName}" must be unique`;
        } else {
          seenNames.add(lower);
        }
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Fetch clinic resources document (clinicSettings/resources).
 * Initializes with 1 Active Chair if not found.
 */
export async function getClinicResources(): Promise<ClinicResourcesData> {
  try {
    const docRef = doc(db, CLINIC_SETTINGS_COLLECTION, "resources");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const raw = snap.data();
      const resData = (raw.clinicResources || raw) as ClinicResourcesData;
      const count = Math.min(4, Math.max(1, resData.chairCount || 1));
      let chairs = Array.isArray(resData.chairs) ? resData.chairs.slice(0, count) : [];

      // Ensure chairs array matches chairCount
      while (chairs.length < count) {
        const idx = chairs.length + 1;
        chairs.push({ id: `chair-${idx}`, name: `Chair ${idx}`, active: true });
      }

      const merged: ClinicResourcesData = {
        chairCount: count,
        chairs,
        createdAt: raw.createdAt || resData.createdAt,
        updatedAt: raw.updatedAt || resData.updatedAt,
      };
      memoryClinicResourcesCache = merged;
      return merged;
    }
  } catch (error) {
    console.warn("Firestore fetch error for clinic resources, using cache fallback:", error);
  }

  return memoryClinicResourcesCache;
}

/**
 * Save or update clinic resources document (clinicSettings/resources).
 */
export async function saveClinicResources(data: ClinicResourcesData): Promise<ClinicResourcesData> {
  const current = await getClinicResources();
  const clinicId = data.clinicId || current.clinicId;

  const count = Math.min(4, Math.max(1, data.chairCount || 1));
  const sanitizedChairs = (data.chairs || []).slice(0, count).map((c, i) => ({
    id: c.id || `chair-${i + 1}`,
    name: (c.name || "").trim() || `Chair ${i + 1}`,
    active: typeof c.active === "boolean" ? c.active : true,
  }));

  const updated: ClinicResourcesData = {
    chairCount: count,
    chairs: sanitizedChairs,
    clinicId: clinicId || "",
    updatedAt: Timestamp.now(),
  };

  if (current.createdAt) {
    updated.createdAt = current.createdAt;
  } else {
    updated.createdAt = Timestamp.now();
  }

  memoryClinicResourcesCache = updated;

  try {
    const docRef = doc(db, CLINIC_SETTINGS_COLLECTION, "resources");
    await setDoc(docRef, { clinicResources: updated, ...updated }, { merge: true });
  } catch (error) {
    console.warn("Firestore setDoc error for clinic resources:", error);
  }

  return updated;
}

/**
 * Helper to fetch only active chairs configured in Clinic Resources.
 */
export async function getActiveChairs(): Promise<ChairItem[]> {
  const resources = await getClinicResources();
  return (resources.chairs || []).filter((c) => c.active);
}
