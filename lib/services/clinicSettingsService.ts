import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "./firestoreConfig";
import type {
  ClinicBasicInfo,
  ClinicSettingsData,
  ClinicAddressDetails,
  ClinicSubscriptionData,
} from "../types";

export const CLINIC_SETTINGS_COLLECTION = COLLECTIONS.CLINIC_SETTINGS || "clinicSettings";

export const DEFAULT_SUBSCRIPTION: ClinicSubscriptionData = {
  plan: "basic",
  status: "active",
  features: {
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
};

export const DEFAULT_CLINIC_ADDRESS: ClinicAddressDetails = {
  line1: "Suite 402, Medical Enclave",
  line2: "M.G. Road",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411001",
};

export const DEFAULT_CLINIC_SETTINGS: ClinicSettingsData = {
  clinicName: "Sanjivani Dental Clinic",
  leadDoctorName: "Dr. Rajesh Sharma",
  doctorQualifications: "BDS, MDS (Oral & Maxillofacial Surgery)",
  dentalCouncilRegNo: "MH-D-18492",
  primaryPhone: "+91 98765 43210",
  whatsappNumber: "+91 98765 43210",
  email: "contact@sanjivanidentals.com",
  websiteUrl: "www.sanjivanidentals.com",
  address: DEFAULT_CLINIC_ADDRESS,
  gstin: "27AAAAA0000A1Z5",
  currencySymbol: "₹",
  invoiceFooterNote: "Thank you for choosing Sanjivani Dentals. Wishing you good dental health!",
  prescriptionFooterNote: "Take medicines strictly as prescribed. For emergency assistance call clinic helpline.",
  logoUrl: "",

  // Backward compatibility alias properties
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
  website: "www.sanjivanidentals.com",
  invoiceFooterText: "Thank you for choosing Sanjivani Dentals. Wishing you good dental health!",
  prescriptionFooterText: "Take medicines strictly as prescribed. For emergency assistance call clinic helpline.",
  gstNumber: "27AAAAA0000A1Z5",
  doctorTitle: "Dr. Rajesh Sharma (BDS, MDS)",
  timing: "Mon - Sat: 09:00 AM - 08:00 PM | Sun: Closed",
  chairsCount: 4,
  subscription: DEFAULT_SUBSCRIPTION,
};

export const DEFAULT_CLINIC_BASIC_INFO: ClinicBasicInfo = {
  ...DEFAULT_CLINIC_SETTINGS,
};

// In-memory cache for ultra-fast UI response & reliable SSR/API fallback
let memoryClinicSettingsCache: ClinicSettingsData = { ...DEFAULT_CLINIC_SETTINGS };

/**
 * Normalizes raw Firestore data into a consistent ClinicSettingsData object
 * with dual canonical + alias properties.
 */
export function normalizeClinicSettings(raw?: any): ClinicSettingsData {
  if (!raw) return { ...DEFAULT_CLINIC_SETTINGS };

  const clinicName = raw.clinicName || DEFAULT_CLINIC_SETTINGS.clinicName;
  const leadDoctorName = raw.leadDoctorName || raw.doctorName || raw.doctorTitle || DEFAULT_CLINIC_SETTINGS.leadDoctorName;
  const doctorQualifications = raw.doctorQualifications || raw.qualification || DEFAULT_CLINIC_SETTINGS.doctorQualifications;
  const dentalCouncilRegNo = raw.dentalCouncilRegNo || raw.registrationNumber || DEFAULT_CLINIC_SETTINGS.dentalCouncilRegNo;
  const primaryPhone = raw.primaryPhone || raw.phone || DEFAULT_CLINIC_SETTINGS.primaryPhone;
  const whatsappNumber = raw.whatsappNumber || raw.whatsapp || primaryPhone || DEFAULT_CLINIC_SETTINGS.whatsappNumber;
  const email = raw.email || DEFAULT_CLINIC_SETTINGS.email;
  const websiteUrl = raw.websiteUrl || raw.website || DEFAULT_CLINIC_SETTINGS.websiteUrl;
  const gstin = raw.gstin || raw.gstNumber || DEFAULT_CLINIC_SETTINGS.gstin;
  const currencySymbol = raw.currencySymbol || "₹";
  const invoiceFooterNote = raw.invoiceFooterNote || raw.invoiceFooterText || DEFAULT_CLINIC_SETTINGS.invoiceFooterNote;
  const prescriptionFooterNote = raw.prescriptionFooterNote || raw.prescriptionFooterText || DEFAULT_CLINIC_SETTINGS.prescriptionFooterNote;
  const logoUrl = raw.logoUrl || raw.clinicLogoUrl || "";

  // Normalize address
  let addressObj: ClinicAddressDetails = { ...DEFAULT_CLINIC_ADDRESS };
  let addressLine1 = raw.addressLine1 || DEFAULT_CLINIC_ADDRESS.line1;
  let addressLine2 = raw.addressLine2 || DEFAULT_CLINIC_ADDRESS.line2;
  let city = raw.city || DEFAULT_CLINIC_ADDRESS.city;
  let state = raw.state || DEFAULT_CLINIC_ADDRESS.state;
  let pincode = raw.pincode || DEFAULT_CLINIC_ADDRESS.pincode;

  if (raw.address && typeof raw.address === "object") {
    addressObj = {
      line1: raw.address.line1 || addressLine1,
      line2: raw.address.line2 || addressLine2,
      city: raw.address.city || city,
      state: raw.address.state || state,
      pincode: raw.address.pincode || pincode,
    };
    addressLine1 = addressObj.line1;
    addressLine2 = addressObj.line2;
    city = addressObj.city;
    state = addressObj.state;
    pincode = addressObj.pincode;
  } else if (typeof raw.address === "string" && raw.address.trim()) {
    addressLine1 = raw.address;
    addressObj = {
      line1: raw.address,
      line2: addressLine2,
      city,
      state,
      pincode,
    };
  } else {
    addressObj = {
      line1: addressLine1,
      line2: addressLine2,
      city,
      state,
      pincode,
    };
  }

  return {
    ...DEFAULT_CLINIC_SETTINGS,
    ...raw,
    clinicName,
    leadDoctorName,
    doctorQualifications,
    dentalCouncilRegNo,
    primaryPhone,
    whatsappNumber,
    email,
    websiteUrl,
    address: addressObj,
    gstin,
    currencySymbol,
    invoiceFooterNote,
    prescriptionFooterNote,
    logoUrl,

    // Aliases
    clinicLogoUrl: logoUrl,
    doctorName: leadDoctorName,
    qualification: doctorQualifications,
    registrationNumber: dentalCouncilRegNo,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    phone: primaryPhone,
    website: websiteUrl,
    invoiceFooterText: invoiceFooterNote,
    prescriptionFooterText: prescriptionFooterNote,
    gstNumber: gstin,
    doctorTitle: `${leadDoctorName} (${doctorQualifications})`,
    subscription: raw.subscription || DEFAULT_SUBSCRIPTION,
  };
}

/**
 * Format clinic address into a clean single-line or multi-line string.
 */
export function formatClinicAddress(
  clinicInfo?: ClinicBasicInfo | ClinicSettingsData | null,
  options?: { multiline?: boolean }
): string {
  if (!clinicInfo) {
    const d = DEFAULT_CLINIC_ADDRESS;
    return options?.multiline
      ? `${d.line1}\n${d.line2 ? `${d.line2}\n` : ""}${d.city}, ${d.state} ${d.pincode}`
      : `${d.line1}, ${d.line2 ? `${d.line2}, ` : ""}${d.city}, ${d.state} ${d.pincode}`;
  }

  if (clinicInfo.address && typeof clinicInfo.address === "object") {
    const a = clinicInfo.address;
    const parts = [
      a.line1,
      a.line2,
      `${a.city ? `${a.city}, ` : ""}${a.state || ""} ${a.pincode || ""}`.trim(),
    ].filter(Boolean);
    return options?.multiline ? parts.join("\n") : parts.join(", ");
  }

  if (typeof clinicInfo.address === "string" && clinicInfo.address.trim()) {
    return clinicInfo.address;
  }

  const line1 = clinicInfo.addressLine1 || "";
  const line2 = clinicInfo.addressLine2 || "";
  const city = clinicInfo.city || "";
  const state = clinicInfo.state || "";
  const pincode = clinicInfo.pincode || "";

  const cityStateZip = `${city ? `${city}, ` : ""}${state} ${pincode}`.trim();
  const parts = [line1, line2, cityStateZip].filter(Boolean);

  return options?.multiline ? parts.join("\n") : parts.join(", ");
}

/**
 * Helper to resolve doctor credentials (Name, Qualifications, Registration No.)
 * with support for custom assigned doctors or fallback to lead doctor.
 */
export function getDoctorCredentials(
  clinicInfo?: ClinicBasicInfo | ClinicSettingsData | null,
  customDoctorName?: string
): { doctorName: string; qualification: string; registrationNumber: string } {
  const norm = normalizeClinicSettings(clinicInfo);
  return {
    doctorName: customDoctorName || norm.leadDoctorName || norm.doctorName || "Dr. Rajesh Sharma",
    qualification: norm.doctorQualifications || norm.qualification || "BDS, MDS (Oral & Maxillofacial Surgery)",
    registrationNumber: norm.dentalCouncilRegNo || norm.registrationNumber || "MH-D-18492",
  };
}

/**
 * Validate clinic basic info / settings payload before saving.
 */
export function validateClinicSettings(
  data: Partial<ClinicSettingsData | ClinicBasicInfo>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.clinicName || !data.clinicName.trim()) {
    errors.clinicName = "Clinic Name is required";
  }

  const doctor = data.leadDoctorName || data.doctorName;
  if (!doctor || !doctor.trim()) {
    errors.leadDoctorName = "Lead Doctor Name is required";
    errors.doctorName = "Doctor Name is required";
  }

  const phone = data.primaryPhone || data.phone;
  const whatsapp = data.whatsappNumber;
  if ((!phone || !phone.trim()) && (!whatsapp || !whatsapp.trim())) {
    errors.primaryPhone = "At least one contact phone or WhatsApp number is required";
  }

  if (!data.email || !data.email.trim()) {
    errors.email = "Clinic Email address is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Please enter a valid email address";
  }

  const line1 =
    (data.address && typeof data.address === "object" ? data.address.line1 : undefined) ||
    data.addressLine1 ||
    (typeof data.address === "string" ? data.address : undefined);

  if (!line1 || !line1.trim()) {
    errors.addressLine1 = "Address Line 1 is required";
  }

  const city =
    (data.address && typeof data.address === "object" ? data.address.city : undefined) ||
    data.city;
  if (!city || !city.trim()) {
    errors.city = "City is required";
  }

  const state =
    (data.address && typeof data.address === "object" ? data.address.state : undefined) ||
    data.state;
  if (!state || !state.trim()) {
    errors.state = "State is required";
  }

  const pincode =
    (data.address && typeof data.address === "object" ? data.address.pincode : undefined) ||
    data.pincode;
  if (!pincode || !pincode.trim()) {
    errors.pincode = "Pincode is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export const validateClinicInfo = validateClinicSettings;

/**
 * Fetch singleton clinic basic info document (clinicSettings/info).
 * Checks primary `clinicSettings/info` doc, with automatic migration & fallback
 * to legacy `clinicSettings/general` and `clinicSettings/config`.
 */
export async function getClinicSettings(): Promise<ClinicSettingsData> {
  try {
    const docRef = doc(db, CLINIC_SETTINGS_COLLECTION, "info");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const normalized = normalizeClinicSettings(snap.data());
      memoryClinicSettingsCache = normalized;
      return normalized;
    }

    // Fallback 1: check legacy "general" doc
    const generalSnap = await getDoc(doc(db, CLINIC_SETTINGS_COLLECTION, "general"));
    if (generalSnap.exists()) {
      const normalized = normalizeClinicSettings(generalSnap.data());
      memoryClinicSettingsCache = normalized;
      return normalized;
    }

    // Fallback 2: check legacy "config" doc
    const configSnap = await getDoc(doc(db, CLINIC_SETTINGS_COLLECTION, "config"));
    if (configSnap.exists()) {
      const normalized = normalizeClinicSettings(configSnap.data());
      memoryClinicSettingsCache = normalized;
      return normalized;
    }
  } catch (error) {
    console.warn("[ClinicSettingsService] Firestore fetch error, falling back to cache:", error);
  }

  return memoryClinicSettingsCache;
}

export const getClinicInfo = getClinicSettings;

/**
 * Create or update singleton clinic settings document (clinicSettings/info).
 * Also keeps legacy `clinicSettings/general` synced for backward compatibility.
 */
export async function updateClinicSettings(
  data: Partial<ClinicSettingsData | ClinicBasicInfo>
): Promise<ClinicSettingsData> {
  const current = await getClinicSettings();
  const clinicId = data.clinicId || current.clinicId || "clinic-1";

  const updated: ClinicSettingsData = normalizeClinicSettings({
    ...current,
    ...data,
    clinicId,
    updatedAt: Timestamp.now(),
    createdAt: current.createdAt || Timestamp.now(),
  });

  memoryClinicSettingsCache = updated;

  try {
    // 1. Primary document
    const docRef = doc(db, CLINIC_SETTINGS_COLLECTION, "info");
    await setDoc(docRef, updated, { merge: true });

    // 2. Legacy "general" document sync
    const legacyRef = doc(db, CLINIC_SETTINGS_COLLECTION, "general");
    await setDoc(
      legacyRef,
      {
        ...updated,
        doctorTitle: updated.doctorTitle || updated.leadDoctorName,
        address: formatClinicAddress(updated),
        gstin: updated.gstin,
      },
      { merge: true }
    );
  } catch (error) {
    console.error("[ClinicSettingsService] Failed to persist clinic settings to Firestore:", error);
    throw error;
  }

  return updated;
}

export const createOrUpdateClinicInfo = updateClinicSettings;
