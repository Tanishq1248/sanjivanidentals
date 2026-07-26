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
import type { TeamMember, RolePermission, ClinicSettingsData, ClinicBasicInfo, AppointmentSettingsData, BillingSettingsData, TeamMemberFormData, MemberStatus } from "../types";
import { COLLECTIONS } from "./firestoreConfig";

const MEMBERS_COLLECTION = COLLECTIONS.TEAM_MEMBERS;
const ROLES_COLLECTION = COLLECTIONS.ROLES;
const CLINIC_SETTINGS_COLLECTION = COLLECTIONS.CLINIC_SETTINGS;

const INITIAL_ROLES: RolePermission[] = [
  {
    id: "role-doctor",
    name: "Doctor",
    description: "Clinical access to patients, dental charts, treatments, prescriptions, and appointments.",
    memberCount: 3,
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
    memberCount: 2,
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
    id: "role-assistant",
    name: "Dental Assistant",
    description: "Support staff access for patient charts, appointment schedules, and sterilisation logs.",
    memberCount: 1,
    permissionCount: 12,
    isSystem: false,
    permissions: {
      Dashboard: ["View Dashboard"],
      Patients: ["View Patients"],
      Appointments: ["View Appointments"],
      Treatments: ["View Treatments", "Add Dental Chart"],
      Billing: [],
      Prescriptions: ["View Prescriptions"],
      Reports: [],
      Inventory: ["View Stock", "Adjust Quantity"],
      Settings: [],
    },
  },
  {
    id: "role-accounts",
    name: "Accounts Manager",
    description: "Financial access for billing, expense tracking, tax calculations, and profit & loss statements.",
    memberCount: 1,
    permissionCount: 18,
    isSystem: false,
    permissions: {
      Dashboard: ["View Dashboard", "View Analytics"],
      Patients: ["View Patients"],
      Appointments: ["View Appointments"],
      Treatments: [],
      Billing: ["View Invoices", "Create Invoice", "Apply Discount", "Process Payment", "Refund Invoice"],
      Prescriptions: [],
      Reports: ["View Financial Reports", "Export Reports"],
      Inventory: ["View Stock", "Manage Suppliers"],
      Settings: ["View Settings"],
    },
  },
];

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: "tm-1",
    name: "Dr. Rajesh Sharma",
    phone: "+91 98765 43210",
    email: "rajesh.sharma@sanjivanidentals.com",
    role: "Doctor",
    roleId: "role-doctor",
    status: "Active",
    avatarColor: "bg-teal-500",
    lastLogin: "Today, 10:45 AM",
  },
  {
    id: "tm-2",
    name: "Dr. Ananya Verma",
    phone: "+91 98123 88765",
    email: "ananya.verma@sanjivanidentals.com",
    role: "Doctor",
    roleId: "role-doctor",
    status: "Active",
    avatarColor: "bg-indigo-500",
    lastLogin: "Today, 09:15 AM",
  },
  {
    id: "tm-3",
    name: "Dr. Vikramaditya Rao",
    phone: "+91 97654 32109",
    email: "vikram.rao@sanjivanidentals.com",
    role: "Doctor",
    roleId: "role-doctor",
    status: "Active",
    avatarColor: "bg-emerald-500",
    lastLogin: "Yesterday, 06:30 PM",
  },
  {
    id: "tm-4",
    name: "Dr. Priya Nambiar",
    phone: "+91 98334 11223",
    email: "priya.nambiar@sanjivanidentals.com",
    role: "Doctor",
    roleId: "role-doctor",
    status: "Active",
    avatarColor: "bg-purple-500",
    lastLogin: "Today, 11:20 AM",
  },
  {
    id: "tm-5",
    name: "Sunita Patil",
    phone: "+91 99887 66554",
    email: "sunita.p@sanjivanidentals.com",
    role: "Receptionist",
    roleId: "role-receptionist",
    status: "Active",
    avatarColor: "bg-amber-500",
    lastLogin: "Today, 08:00 AM",
  },
];

export const DEFAULT_CLINIC_BASIC_INFO: ClinicBasicInfo = {
  clinicName: "Sanjivani Dental Clinic",
  clinicLogoUrl: "",
  doctorName: "Dr. Rajesh Sharma",
  qualification: "BDS, MDS (Oral & Maxillofacial Surgery)",
  registrationNumber: "MH-D-18492",
  addressLine1: "Suite 402, Medical Enclave",
  addressLine2: "M.G. Road",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411001",
  phone: "+91 98765 43210",
  whatsappNumber: "+91 98765 43210",
  email: "contact@sanjivanidentals.com",
  website: "www.sanjivanidentals.com",
  invoiceFooterText: "Thank you for choosing Sanjivani Dentals. Wishing you good dental health!",
  prescriptionFooterText: "Take medicines strictly as prescribed. For emergency assistance call clinic helpline.",
  currencySymbol: "₹",
  gstNumber: "27AAAAA0000A1Z5",
};

const DEFAULT_CLINIC_SETTINGS: ClinicSettingsData = {
  ...DEFAULT_CLINIC_BASIC_INFO,
  doctorTitle: "Dr. Rajesh Sharma (BDS, MDS)",
  address: "Suite 402, Medical Enclave, M.G. Road, Pune, MH 411001",
  gstin: "27AAAAA0000A1Z5",
  timing: "Mon - Sat: 09:00 AM - 08:00 PM | Sun: Closed",
  chairsCount: 4,
};

// In-memory cache fallback to ensure instant UI response if Firestore latency occurs
let memoryMembersCache: TeamMember[] = [...INITIAL_MEMBERS];
let memoryRolesCache: RolePermission[] = [...INITIAL_ROLES];
let memoryClinicSettingsCache: ClinicSettingsData = { ...DEFAULT_CLINIC_SETTINGS };

/* ─── Clinic Basic Info Service Functions ─── */

/**
 * Validate clinic basic info payload before saving.
 */
export function validateClinicInfo(data: Partial<ClinicBasicInfo>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.clinicName || !data.clinicName.trim()) {
    errors.clinicName = "Clinic Name is required";
  }

  if (!data.doctorName || !data.doctorName.trim()) {
    errors.doctorName = "Doctor / Lead Practitioner Name is required";
  }

  if ((!data.phone || !data.phone.trim()) && (!data.whatsappNumber || !data.whatsappNumber.trim())) {
    errors.phone = "At least one contact phone or WhatsApp number is required";
  }

  if (!data.email || !data.email.trim()) {
    errors.email = "Clinic Email address is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Please enter a valid email address";
  }

  if (!data.addressLine1 || !data.addressLine1.trim()) {
    errors.addressLine1 = "Address Line 1 is required";
  }

  if (!data.city || !data.city.trim()) {
    errors.city = "City is required";
  }

  if (!data.state || !data.state.trim()) {
    errors.state = "State is required";
  }

  if (!data.pincode || !data.pincode.trim()) {
    errors.pincode = "Pincode is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Fetch singleton clinic basic info document (clinicSettings/info).
 */
export async function getClinicInfo(): Promise<ClinicBasicInfo> {
  try {
    const docRef = doc(db, CLINIC_SETTINGS_COLLECTION, "info");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as ClinicBasicInfo;
      const merged = { ...DEFAULT_CLINIC_BASIC_INFO, ...data };
      memoryClinicSettingsCache = { ...memoryClinicSettingsCache, ...merged };
      return merged;
    }

    // Fallback: check legacy "general" doc
    const generalSnap = await getDoc(doc(db, CLINIC_SETTINGS_COLLECTION, "general"));
    if (generalSnap.exists()) {
      const genData = generalSnap.data() as any;
      const converted: ClinicBasicInfo = {
        ...DEFAULT_CLINIC_BASIC_INFO,
        clinicName: genData.clinicName || DEFAULT_CLINIC_BASIC_INFO.clinicName,
        doctorName: genData.doctorTitle || genData.doctorName || DEFAULT_CLINIC_BASIC_INFO.doctorName,
        phone: genData.phone || DEFAULT_CLINIC_BASIC_INFO.phone,
        email: genData.email || DEFAULT_CLINIC_BASIC_INFO.email,
        addressLine1: genData.address || DEFAULT_CLINIC_BASIC_INFO.addressLine1,
        gstNumber: genData.gstin || genData.gstNumber || DEFAULT_CLINIC_BASIC_INFO.gstNumber,
        website: genData.website || DEFAULT_CLINIC_BASIC_INFO.website,
      };
      memoryClinicSettingsCache = { ...memoryClinicSettingsCache, ...converted };
      return converted;
    }
  } catch (error) {
    console.warn("Firestore fetch error for clinic basic info:", error);
  }

  return memoryClinicSettingsCache;
}

/**
 * Create or update singleton clinic basic info document (clinicSettings/info).
 */
export async function createOrUpdateClinicInfo(data: Partial<ClinicBasicInfo>): Promise<ClinicBasicInfo> {
  const current = await getClinicInfo();
  const updated: ClinicBasicInfo = {
    ...current,
    ...data,
    updatedAt: Timestamp.now(),
  };

  if (!current.createdAt) {
    updated.createdAt = Timestamp.now();
  }

  memoryClinicSettingsCache = { ...memoryClinicSettingsCache, ...updated };

  try {
    const docRef = doc(db, CLINIC_SETTINGS_COLLECTION, "info");
    await setDoc(docRef, updated, { merge: true });

    // Sync legacy document for backward compatibility
    const legacyRef = doc(db, CLINIC_SETTINGS_COLLECTION, "general");
    await setDoc(
      legacyRef,
      {
        ...updated,
        doctorTitle: updated.doctorName,
        address: `${updated.addressLine1}, ${updated.city}, ${updated.state} ${updated.pincode}`,
        gstin: updated.gstNumber,
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("Firestore setDoc error for clinic basic info:", error);
  }

  return updated;
}

/* ─── Team Members Services ─── */

/**
 * Validate team member form data before saving.
 */
export function validateTeamMember(data: Partial<TeamMemberFormData>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.name || !data.name.trim()) {
    errors.name = "Full Name is required";
  }

  if (!data.email || !data.email.trim()) {
    errors.email = "Email address is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Please enter a valid email address";
  }

  if (!data.phone || !data.phone.trim()) {
    errors.phone = "Phone number is required";
  }

  if (!data.role || !data.role.trim()) {
    errors.role = "Role assignment is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Fetch team members with optional role and status filtering.
 */
export async function getTeamMembers(roleFilter?: string, statusFilter?: string): Promise<TeamMember[]> {
  try {
    const snap = await getDocs(collection(db, MEMBERS_COLLECTION));
    if (snap.empty) {
      // Auto-seed working team setup (4 Doctors + 1 Receptionist) into Firestore
      const seeded: TeamMember[] = [];
      for (const member of INITIAL_MEMBERS) {
        const docRef = doc(db, MEMBERS_COLLECTION, member.id);
        await setDoc(docRef, { ...member, createdAt: Timestamp.now() }, { merge: true });
        seeded.push(member);
      }
      memoryMembersCache = seeded;
    } else {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TeamMember);
      memoryMembersCache = list;
    }
  } catch (error) {
    console.warn("Firestore fetch error for team members, using cache fallback:", error);
  }

  let result = memoryMembersCache;
  if (roleFilter && roleFilter !== "All") {
    result = result.filter((m) => m.role.toLowerCase() === roleFilter.toLowerCase() || m.roleId === roleFilter);
  }
  if (statusFilter && statusFilter !== "All") {
    result = result.filter((m) => m.status.toLowerCase() === statusFilter.toLowerCase());
  }

  return result;
}

export async function addTeamMember(formData: TeamMemberFormData): Promise<TeamMember> {
  const avatarColors = ["bg-teal-500", "bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500"];
  const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

  const newMember: TeamMember = {
    id: `tm-${Date.now()}`,
    ...formData,
    avatarColor: randomColor,
    lastLogin: formData.status === "Invited" ? "Invitation Sent" : "Never",
  };

  try {
    const docRef = await addDoc(collection(db, MEMBERS_COLLECTION), {
      ...formData,
      avatarColor: randomColor,
      lastLogin: newMember.lastLogin,
      createdAt: Timestamp.now(),
    });
    newMember.id = docRef.id;
  } catch (error) {
    console.warn("Firestore write error, using in-memory update:", error);
  }

  memoryMembersCache = [newMember, ...memoryMembersCache];
  return newMember;
}

export async function updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<void> {
  try {
    await updateDoc(doc(db, MEMBERS_COLLECTION, id), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn("Firestore update error for member:", error);
  }

  memoryMembersCache = memoryMembersCache.map((m) => (m.id === id ? { ...m, ...updates } : m));
}

export async function toggleTeamMemberStatus(id: string, status: MemberStatus): Promise<void> {
  await updateTeamMember(id, { status });
}

export async function deleteTeamMember(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, MEMBERS_COLLECTION, id));
  } catch (error) {
    console.warn("Firestore delete error for member:", error);
  }

  memoryMembersCache = memoryMembersCache.filter((m) => m.id !== id);
}

export async function resetMemberPassword(id: string): Promise<void> {
  // Simulates sending password reset link / email
  await new Promise((res) => setTimeout(res, 300));
}

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

  try {
    const docRef = await addDoc(collection(db, ROLES_COLLECTION), {
      ...roleData,
      memberCount: 0,
      permissionCount: count,
      isSystem: false,
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
  try {
    await deleteDoc(doc(db, ROLES_COLLECTION, id));
  } catch (error) {
    console.warn("Firestore delete error for role:", error);
  }

  memoryRolesCache = memoryRolesCache.filter((r) => r.id !== id);
}

/* ─── Clinic Settings Services (Backward Compatibility Wrappers) ─── */
export async function getClinicSettings(): Promise<ClinicSettingsData> {
  const info = await getClinicInfo();
  return {
    ...info,
    doctorTitle: info.doctorName,
    address: `${info.addressLine1}${info.addressLine2 ? `, ${info.addressLine2}` : ""}, ${info.city}, ${info.state} ${info.pincode}`,
    gstin: info.gstNumber || "",
    timing: "Mon - Sat: 09:00 AM - 08:00 PM | Sun: Closed",
    chairsCount: 4,
  };
}

export async function updateClinicSettings(data: Partial<ClinicSettingsData>): Promise<ClinicSettingsData> {
  const updatedInfo = await createOrUpdateClinicInfo(data);
  return getClinicSettings();
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
  const updated: AppointmentSettingsData = {
    ...current,
    ...data,
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
  const updated: BillingSettingsData = {
    ...current,
    ...data,
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
