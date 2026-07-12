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
  // ── Future-ready fields (not yet active) ──
  // referralCampaignId?: string;   // for campaign tracking
  // referralRewardStatus?: "pending" | "claimed" | "expired";
  // referralNotes?: string;
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
  updatedAt: Timestamp;
}

/* ─── Patient Encounter ─── */
export type EncounterStatus = "Pending" | "In Progress" | "Completed" | "Cancelled";

export interface ToothTreatmentEntry {
  id: string;
  toothNumber: number;
  treatmentName: string;
  status: string; // "Completed" | "In Progress" | "Planned"
  fee: number;
  notes?: string;
  date: string; // DD/MM/YYYY
  timestamp: string; // ISO string
}

export interface PatientEncounter {
  id: string;
  patientId: string;
  appointmentId?: string;
  doctorId: string;
  doctorName: string;
  visitDate: string; // YYYY-MM-DD
  chiefComplaint: string;
  diagnosis: string;
  treatments: string[];
  toothTreatments?: ToothTreatmentEntry[];
  prescriptionId?: string;
  followUpDate?: string; // YYYY-MM-DD
  status: EncounterStatus;
  notes: string;
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
  createdAt: Timestamp;
}

/* ─── Invoice ─── */
export type InvoiceStatus = "Paid" | "Pending" | "Failed";
export type PaymentMethod = "Cash" | "Card" | "UPI" | "Net Banking" | "Insurance" | "None";

export interface InvoiceItem {
  id: string;
  treatmentName: string;
  toothNumber?: number;
  fee: number;
}

export interface Invoice {
  id: string;
  patientId: string;
  encounterId?: string;
  appointmentId?: string;
  amount: number;
  paymentStatus: InvoiceStatus;
  paymentMethod: PaymentMethod;
  invoiceDate: string; // YYYY-MM-DD
  createdAt: Timestamp;

  // New fields for billing review and details
  patientName?: string;
  visitDate?: string;
  items?: InvoiceItem[];
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
  /** Dental chair assigned to this appointment (e.g. "Chair 1"). */
  chair?: string;
  /** Appointment duration in minutes. Defaults to 30 if not set. */
  duration?: number;
  /** Timestamp when patient checked in at the clinic. */
  checkInTime?: Timestamp;
  /** Timestamp when the appointment was completed. */
  completedTime?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type AppointmentFormData = Pick<
  Appointment,
  "patientName" | "patientPhone" | "patientEmail" | "service" | "date" | "time"
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
}

/* ─── Appointment Filter ─── */
export type AppointmentFilter = "today" | "upcoming" | "history" | "all";

/* ─── Prescription ─── */
export interface Medication {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  prescriptionId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: string;
  appointmentId: string;
  doctorId: string;
  prescriptionNumber: string;
  diagnosis: string;
  medications: Medication[];
  additionalInstructions: string;
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Singleton config document storing the clinic's unique referral code. */
export interface ClinicReferralConfig {
  referralCode: string;             // e.g., "DP-8XK29A"
  clinicName: string;
  createdAt: Timestamp;
}

/** Lightweight subscription stub — ready for future billing integration. */
export interface SubscriptionInfo {
  planName: string;                 // e.g., "Free", "Pro", "Enterprise"
  expiryDate: string;               // YYYY-MM-DD
  freeMonthsEarned: number;
  totalSuccessfulReferrals: number;
  updatedAt: Timestamp;
}
