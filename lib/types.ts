import { Timestamp } from "firebase/firestore";

/* ─── Referral Sources ─── */
export const REFERRAL_SOURCES = [
  "Existing Patient",
  "Doctor",
  "Friend / Family",
  "Google Search",
  "Google Maps",
  "Instagram",
  "Facebook",
  "Website",
  "Walk-in",
  "Newspaper",
  "Other",
] as const;

export type ReferralSource = (typeof REFERRAL_SOURCES)[number];

/* ─── Patient ─── */
export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  age: string;
  lastVisit: string;
  condition: string;
  notes: string;
  avatarColor: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  gender?: string;
  diseases?: string;
  bloodType?: string;
  allergies?: string;
  address?: string;
  // ── Referral Tracking (added for referral module) ──
  referralSource?: string;          // one of REFERRAL_SOURCES
  referredByPatientId?: string;     // Firestore ID of the referring patient
  clinicId?: string;
}

export type PatientFormData = Omit<Patient, "id" | "avatarColor" | "createdAt" | "updatedAt">;

/* ─── Patient Medical Profile ─── */
export interface PatientMedicalProfile {
  patientId: string;
  bloodGroup: string;
  allergies: string;
  chronicDiseases: string;
  medicalConditions: string;
  clinicalNotes: string;
  emergencyContact?: string;
  clinicId?: string;
  updatedAt: Timestamp;
}

/* ─── Patient Encounter ─── */
export type EncounterStatus = "Pending" | "In Progress" | "Completed" | "Cancelled";

export type ClinicalTreatmentStatus = "Planned" | "In Progress" | "Completed";
export type BillingStatus = "Unbilled" | "Billed";

/** Individual tooth surface type identifier */
export type SurfaceType = "M" | "D" | "B" | "L" | "O" | "I" | "Labial";

/** Map of surface type codes to human-readable names */
export const SURFACE_LABELS: Record<SurfaceType, string> = {
  M: "Mesial",
  D: "Distal",
  B: "Buccal",
  L: "Lingual",
  O: "Occlusal",
  I: "Incisal",
  Labial: "Labial",
};

export interface ToothTreatmentEntry {
  id: string;
  toothNumber: number;
  surfaces?: SurfaceType[];
  treatmentName: string;
  status: string; // Clinical status ("Completed" | "In Progress" | "Planned") for backward compatibility
  treatmentStatus?: ClinicalTreatmentStatus; // Explicit Clinical Status
  billingStatus?: BillingStatus; // Explicit Financial Status ("Unbilled" | "Billed")
  invoiceId?: string | null; // Generated Invoice ID link
  fee: number;
  notes?: string;
  date: string; // DD/MM/YYYY
  timestamp: string; // ISO string
}

/**
 * Helper to derive clinical treatment status for a tooth treatment entry.
 * Priority:
 * 1. Explicit tt.treatmentStatus ("Planned" | "In Progress" | "Completed")
 * 2. Explicit tt.status ("Planned" | "In Progress" | "Completed")
 * 3. Fallback to encounterStatus ONLY if treatment row has no explicit status
 */
export function getTreatmentStatus(
  treatment: { status?: string; treatmentStatus?: ClinicalTreatmentStatus },
  fallbackEncounterStatus?: string
): ClinicalTreatmentStatus {
  if (treatment.treatmentStatus === "Planned" || treatment.treatmentStatus === "In Progress" || treatment.treatmentStatus === "Completed") {
    return treatment.treatmentStatus;
  }
  if (treatment.status === "Planned" || treatment.status === "In Progress" || treatment.status === "Completed") {
    return treatment.status as ClinicalTreatmentStatus;
  }
  if (fallbackEncounterStatus === "Completed") return "Completed";
  if (fallbackEncounterStatus === "In Progress") return "In Progress";
  return "Planned";
}

export interface PatientEncounter {
  id: string;
  patientId: string;
  appointmentId?: string;
  doctorId: string;
  doctorName: string;
  visitDate: string; // YYYY-MM-DD
  visitTime?: string; // HH:MM or 04:20 PM
  casePaperNumber?: number;
  chiefComplaint: string;
  chiefComplaints?: string[];
  diagnosis: string;
  treatments: string[];
  toothTreatments?: ToothTreatmentEntry[];
  prescriptionId?: string;
  followUpDate?: string; // YYYY-MM-DD
  status: EncounterStatus;
  notes: string;
  clinicId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ─── Doctor ─── */
export interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
  phone: string;
  email: string;
  availability: string[];
  status: "Active" | "Inactive";
  clinicId?: string;
  createdAt: Timestamp;
}

/* ─── Invoice ─── */
export type InvoiceStatus = "Paid" | "Pending" | "Failed" | "Partial" | "Overdue" | "Due Today";
export type PaymentMethod = "Cash" | "Card" | "UPI" | "Net Banking" | "Insurance" | "None" | "Bank Transfer" | "Cheque";

export interface InvoiceItem {
  id: string;
  treatmentName: string;
  toothNumber?: number;
  fee: number;
}

export interface PaymentHistoryEntry {
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod | string;
  amountReceived: number;
  paymentType: "Paid" | "Partial" | "Installment" | "Pending" | "Generated";
  notes?: string;
}

export interface InstallmentPlan {
  totalInstallments: number;
  currentInstallment: number;
  remainingInstallments: number;
  installmentAmount: number;
}

export interface Invoice {
  id: string;
  patientId: string;
  encounterId?: string;
  appointmentId?: string;
  amount: number;
  paymentStatus: InvoiceStatus | string;
  paymentMethod: PaymentMethod;
  invoiceDate: string; // YYYY-MM-DD
  clinicId?: string;
  createdAt: Timestamp;

  // New fields for billing review and details
  patientName?: string;
  visitDate?: string;
  items?: InvoiceItem[];
  treatments?: string[];
  grossAmount?: number;
  taxAmount?: number;
  discountPercentage?: number;
  discountAmount?: number;
  netAmount?: number;
  emailSent?: boolean;
  emailSentAt?: Timestamp;
  status?: string;
  total?: number;
  subtotal?: number;
  discount?: number;
  tax?: number;

  // Extended payment workflow fields
  paidAmount?: number;
  remainingAmount?: number;
  dueDate?: string;
  paymentHistory?: PaymentHistoryEntry[];
  installmentPlan?: InstallmentPlan | null;

  // Document Storage Metadata
  storagePath?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  documentVersion?: number;
  updatedAt?: Timestamp;
}

/* ─── Appointment ─── */
export type AppointmentStatus =
  | "Pending"
  | "Confirmed"
  | "Checked In"
  | "In Progress"
  | "Completed"
  | "Cancelled"
  | "No Show";

/** Available dental chairs — extend this array to add more chairs. */
export const CHAIR_OPTIONS = ["Chair 1", "Chair 2", "Chair 3", "Chair 4"] as const;
export type ChairOption = typeof CHAIR_OPTIONS[number];

/** Standard appointment duration options in minutes. */
export const DURATION_OPTIONS = [15, 30, 45, 60, 90] as const;
export type DurationOption = typeof DURATION_OPTIONS[number];

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientId: string;
  service: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  source: "online_booking" | "admin_created";
  doctorId?: string;
  doctorName?: string;
  /** Dental chair ID assigned to this appointment (e.g. "chair-1"). */
  chairId?: string;
  /** Dental chair name assigned to this appointment (e.g. "Chair 1"). */
  chair?: string;
  /** Appointment duration in minutes. Defaults to 30 if not set. */
  duration?: number;
  /** Timestamp when patient checked in at the clinic. */
  checkInTime?: Timestamp;
  /** Timestamp when the appointment was completed. */
  completedTime?: Timestamp;
  clinicId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type AppointmentFormData = Pick<
  Appointment,
  "patientName" | "patientPhone" | "patientEmail" | "service" | "date" | "time" | "clinicId"
>;

/* ─── Notification ─── */
export type NotificationType =
  | "new_booking"
  | "appointment_reminder"
  | "patient_update";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  appointmentId: string;
  patientId: string;
  read: boolean;
  clinicId?: string;
  createdAt: Timestamp;
}

/* ─── Service ─── */
export type ServiceCategory =
  | "general"
  | "cosmetic"
  | "emergency"
  | "orthodontics";

export interface DentalService {
  id: string;
  name: string;
  category: ServiceCategory;
  isActive: boolean;
  clinicId?: string;
}

/* ─── Clinic Settings ─── */
export interface ClinicSettings {
  clinicName: string;
  phone: string;
  whatsapp: string;
  address: string;
  workingHours: {
    start: string;
    end: string;
    days: string;
  };
  timeSlots: string[];
  clinicId?: string;
}

/* ─── Appointment Filter ─── */
export type AppointmentFilter = "today" | "upcoming" | "history" | "all";

/* ─── Prescription ─── */
export interface Medication {
  medicine: string;
  genericName?: string;
  form?: string;
  dosage: string;
  frequency: string;
  duration: string;
  timing?: string; // e.g., "After Food", "Before Food", "At Bedtime"
  notes?: string;   // e.g., "If pain persists"
  drugClass?: string;
}

export interface Prescription {
  prescriptionId: string;
  encounterId?: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: string;
  patientGender?: string;
  appointmentId?: string;
  doctorId?: string;
  doctorName?: string;
  doctorSpecialization?: string;
  doctorRegistrationNumber?: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  prescriptionNumber: string;
  chiefComplaint?: string;
  diagnosis: string;
  medications: Medication[];
  advice?: string;
  dietInstructions?: string;
  oralHygieneInstructions?: string;
  additionalInstructions: string;
  followUpDate?: string;
  followUpReason?: string;
  // Document Storage Metadata
  storagePath?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  documentVersion?: number;
  status?: string;
  clinicId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ─── Document Storage Service Types ─── */
export type DocumentCategoryType =
  | "prescriptions"
  | "invoices"
  | "medical_reports"
  | "consent_forms"
  | "referral_letters"
  | "laboratory_reports"
  | string;

export interface UploadDocumentOptions {
  fileData: Buffer | Uint8Array | Blob | ArrayBuffer;
  documentId: string; // e.g., prescriptionId
  patientId: string;
  encounterId?: string;
  clinicId?: string;
  documentType?: DocumentCategoryType;
  fileName?: string;
  year?: string | number;
  month?: string | number;
  customMetadata?: Record<string, string>;
}

export interface UploadResult {
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface DocumentMetadataRecord {
  id?: string;
  patientId: string;
  encounterId?: string;
  clinicId: string;
  prescriptionId?: string;
  documentType: DocumentCategoryType;
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  documentVersion: number;
  status: "active" | "archived" | "deleted" | string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

export interface PaginatedResult<T> {
  data: T[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  hasNext: boolean;
}

/* ─── Dental Chart (Firestore-ready shapes) ─── */

/**
 * Firestore-ready tooth condition codes.
 * Mirrors ToothConditionCode in components/dental-chart/types.ts.
 * Defined here so service layer and Firestore security rules can
 * reference it without importing from the components folder.
 */
export type ToothConditionCode =
  | "healthy"
  | "cavity"
  | "filled"
  | "extracted"
  | "crowned"
  | "root_canal"
  | "bridge"
  | "implant"
  | "missing"
  | "impacted"
  | "watch";

/**
 * Represents the persisted Firestore document shape for a single tooth record.
 * Future collection: `toothRecords` (sub-collection or top-level).
 *
 * EXTENSION POINT D: When Firestore is wired, create toothRecordService.ts
 * that reads/writes documents matching this interface.
 */
export interface ToothRecord {
  id?: string;
  toothNumber: number;   // FDI: 11–18, 21–28, 31–38, 41–48
  patientId: string;
  condition: ToothConditionCode;
  notes?: string;
  // FUTURE: treatmentHistory: TreatmentEntry[]
  // FUTURE: treatmentPlan: PlanEntry[]
  // FUTURE: updatedAt: Timestamp
  // FUTURE: updatedBy: string  (doctorId)
}

/* ─── Expenses & Finance ─── */
export const EXPENSE_CATEGORIES = [
  "Rent",
  "Salaries",
  "Dental Supplies",
  "Laboratory Charges",
  "Equipment Maintenance",
  "Utilities",
  "Internet",
  "Marketing",
  "Miscellaneous",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string;
  expenseTitle: string;
  category: ExpenseCategory | string;
  amount: number;
  expenseDate: string; // YYYY-MM-DD
  paymentMethod: string;
  vendor?: string;
  notes?: string;
  clinicId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // User email who recorded it
}

export type ExpenseFormData = Omit<Expense, "id" | "createdAt" | "updatedAt" | "createdBy">;

/* ─── Clinic Referral (Refer & Earn) ─── */
export type ClinicReferralStatus = "Pending" | "Successful" | "Reward Applied" | "Expired";

/** Extensible reward type — currently only free_months is active. */
export type RewardType = "free_months" | "cash" | "coupon";

export interface ClinicReferral {
  id: string;
  referralCode: string;            // This clinic's referral code (e.g., "DP-8XK29A")
  referrerClinicId: string;         // This clinic's identifier
  referredClinicName: string;       // Name of the referred clinic
  referredClinicEmail: string;      // Contact email of the referred clinic
  referredClinicId?: string;        // Their identifier (set after registration)
  status: ClinicReferralStatus;
  referredAt: string;               // ISO date when referral was created
  activatedAt?: string;             // ISO date when subscription was purchased
  rewardType: RewardType;
  rewardMonths: number;             // Default: 1
  rewardApplied: boolean;
  clinicId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Singleton config document storing the clinic's unique referral code. */
export interface ClinicReferralConfig {
  referralCode: string;             // e.g., "DP-8XK29A"
  clinicName: string;
  clinicId?: string;
  createdAt: Timestamp;
}

export type SubscriptionPlanType = "basic" | "professional" | "enterprise";

export interface SubscriptionFeatures {
  rolePermissions: boolean;
  maxDoctors: number;
  maxReceptionists: number;
  customRoles: boolean;
  permissionEditing: boolean;
  chairManagement: boolean;
  advancedAnalytics: boolean;
  whatsappAutomation: boolean;
  auditLogs: boolean;
}

export interface ClinicSubscriptionData {
  plan: SubscriptionPlanType;
  status: "active" | "trial" | "expired" | "cancelled";
  features: SubscriptionFeatures;
}

/** Lightweight subscription stub — ready for future billing integration. */
export interface SubscriptionInfo {
  planName: string;                 // e.g., "Free", "Pro", "Enterprise"
  expiryDate: string;               // YYYY-MM-DD
  freeMonthsEarned: number;
  totalSuccessfulReferrals: number;
  clinicId?: string;
  updatedAt: Timestamp;
}

/* ─── Settings, Team & Roles ─── */
export type MemberStatus = "Active" | "Inactive" | "Invited" | "Suspended";

export interface TeamMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;          // Role name e.g. "Doctor", "Receptionist", "Admin"
  roleId: string;        // Matching Role ID
  status: MemberStatus;
  avatarColor: string;
  lastLogin: string;     // e.g. "Today, 02:15 PM" or "Yesterday"
  clinicId?: string;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export type TeamMemberFormData = Omit<TeamMember, "id" | "avatarColor" | "lastLogin" | "createdAt" | "updatedAt">;

export type PermissionAction = "View" | "Add" | "Edit" | "Delete" | "Export" | string;

export type PermissionGroupKey =
  | "Dashboard"
  | "Patients"
  | "Appointments"
  | "Treatments"
  | "Billing"
  | "Prescriptions"
  | "Reports"
  | "Inventory"
  | "Settings";

export interface RolePermission {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  permissionCount: number;
  isSystem?: boolean;    // System roles like "Admin" cannot be deleted
  permissions: Record<string, string[]>; // e.g. { Patients: ["View", "Add", "Edit"], Billing: ["View", "Create"] }
  clinicId?: string;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export interface AppointmentSettingsData {
  defaultSlotDurationMinutes: number; // 15, 30, 45, 60
  bufferTimeMinutes: number;          // 0, 5, 10, 15
  autoConfirmWebBookings: boolean;    // true / false
  allowChairOverbooking: boolean;     // true / false
  clinicId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface BillingSettingsData {
  invoiceNumberPrefix: string;     // e.g., "DP-INV-"
  nextInvoiceNumber: number;        // e.g., 1001
  defaultGstRate: number;           // e.g., 0, 5, 12, 18
  systemCurrency: string;           // e.g., "INR"
  currencySymbol: string;           // e.g., "₹"
  taxIncludedMode?: boolean;        // whether prices include tax
  invoiceFooterText?: string;       // footer note
  paymentInstructions?: string;     // bank transfer / UPI payment instructions
  clinicId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ChairItem {
  id: string;
  name: string;
  active: boolean;
}

export interface ClinicResourcesData {
  chairCount: number;
  chairs: ChairItem[];
  clinicId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/* ─── Security Module ─── */

export type LoginStatus = "success" | "failed" | "logged_out" | "session_expired";

export interface LoginHistoryEntry {
  id?: string;
  userId: string;
  userName: string;
  userRole: string;
  deviceInfo: string;       // e.g., "Windows 10 / Chrome 120"
  browserName: string;      // e.g., "Chrome"
  status: LoginStatus;
  loginTime: Timestamp;
  logoutTime?: Timestamp;
  ipAddress?: string;       // approximate, optional
  clinicId?: string;
  createdAt: Timestamp;
}

export interface AuditLogEntry {
  id?: string;
  actorUserId: string;
  actorName: string;
  actorRole: string;
  actionType: string;       // e.g., "patient_created", "invoice_generated"
  entityType: string;       // e.g., "Patient", "Invoice", "Settings"
  entityId?: string;
  entityName?: string;
  message: string;          // human-readable description
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
  success: boolean;
  clinicId?: string;
}

export interface SecuritySettingsData {
  sessionTimeoutMinutes: number;   // 15, 30, 60, 120
  auditLoggingEnabled: boolean;
  clinicId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/* ─── Session Lifecycle ─── */
export type SessionStatus = "active" | "inactive" | "expired" | "revoked";

export interface SecuritySession {
  id?: string;
  sessionId: string;         // unique ID (matches Firestore doc ID)
  userId: string;
  userName: string;
  role: string;
  deviceId: string;          // stable ID stored in localStorage
  deviceName: string;        // e.g. "Windows / Chrome"
  browserName: string;
  platform: string;          // e.g. "Windows"
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  expiresAt: Timestamp;
  status: SessionStatus;
  isCurrent: boolean;
  isRevoked: boolean;
  revokedAt?: Timestamp;
  revokeReason?: string;
  clinicId?: string;
}

export interface ClinicBasicInfo {
  clinicName: string;
  clinicLogoUrl?: string;
  doctorName: string;
  qualification?: string;
  registrationNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  whatsappNumber?: string;
  email: string;
  website?: string;
  invoiceFooterText?: string;
  prescriptionFooterText?: string;
  currencySymbol?: string;
  gstNumber?: string;
  subscription?: ClinicSubscriptionData;
  clinicId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/* ─── Twilio WhatsApp Messaging ─── */
export type WhatsAppMessageType = "prescription" | "invoice" | "appointment_reminder";

export interface WhatsAppMessagePayload {
  messageType: WhatsAppMessageType;
  recipient: string;
  patientId: string;
  patientName: string;
  encounterId?: string;
  prescriptionId?: string;
  invoiceId?: string;
  appointmentId?: string;
  clinicName?: string;
  doctorName?: string;
  clinicPhone?: string;
  date?: string;
  time?: string;
  invoiceNumber?: string;
  invoiceAmount?: number | string;
  followUpDate?: string;
  mediaUrl?: string;
  customText?: string;
}

export interface MessagingQuotaInfo {
  clinicId: string;
  month: string; // YYYY-MM
  monthlyLimit: number;
  messagesSent: number;
  updatedAt: Timestamp;
}

export type WhatsAppDeliveryStatus =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "quota_exceeded";

export interface MessageLogEntry {
  id?: string;
  messageId?: string;
  patientId: string;
  encounterId?: string;
  invoiceId?: string;
  appointmentId?: string;
  messageType: WhatsAppMessageType;
  recipient: string;
  twilioMessageSid?: string;
  status: WhatsAppDeliveryStatus;
  sentAt?: Timestamp;
  clinicId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deliveredAt?: Timestamp;
  failedAt?: Timestamp;
  lastAttemptAt?: Timestamp;
  attemptCount?: number;
  errorCode?: string;
  errorMessage?: string;
}

export type MessageChannel = "whatsapp" | "email";
export type MessageTemplateType = "prescription" | "invoice" | "appointment_reminder";

export interface MessageTemplate {
  id: string; // e.g., "prescription_whatsapp"
  name: string;
  channel: MessageChannel;
  messageType: MessageTemplateType;
  subject?: string; // Email only
  body: string;
  signature?: string; // Email only
  footer?: string; // Email only
  status: "active" | "inactive";
  clinicId?: string;
  updatedAt?: Timestamp;
  updatedBy?: string;
}

export type MessageTemplatesDocument = Record<string, MessageTemplate>;

export interface ClinicSettingsData extends ClinicBasicInfo {
  currencySymbol?: string;
  gstNumber?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  // Backward compatibility alias fields
  doctorTitle?: string;
  address?: string;
  gstin?: string;
  timing?: string;
  chairsCount?: number;
}

