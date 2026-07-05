import { Timestamp } from "firebase/firestore";

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
}

/* ─── Appointment ─── */
export type AppointmentStatus =
  | "Pending"
  | "Confirmed"
  | "In Progress"
  | "Cancelled"
  | "Completed";

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

