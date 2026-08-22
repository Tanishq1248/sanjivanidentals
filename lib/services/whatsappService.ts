import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS, DEFAULT_CLINIC_ID } from "./firestoreConfig";
import type {
  WhatsAppMessagePayload,
  WhatsAppMessageType,
  MessagingQuotaInfo,
  MessageLogEntry,
} from "../types";

export const DEFAULT_MONTHLY_QUOTA = 500;

/**
 * Format any phone number into clean E.164 format.
 * Defaults to +91 country code for 10-digit Indian numbers if un-prefixed.
 */
export function formatE164(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  // Handle 10-digit Indian mobile number
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // If 12 digits starting with 91
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return `+${cleaned}`;
}

/**
 * Validate phone number eligibility for WhatsApp E.164.
 */
export function validateWhatsAppPhone(phone: string): boolean {
  const formatted = formatE164(phone);
  // Must be in format +[1-9][0-9]{7,14}
  return /^\+[1-9]\d{7,14}$/.test(formatted);
}

import { DEFAULT_TEMPLATES, compileTemplate } from "./messageTemplateService";

/**
 * Generate centralized WhatsApp template message body using dynamic template compilation.
 */
export function generateWhatsAppMessageBody(
  payload: WhatsAppMessagePayload,
  customTemplateBody?: string
): string {
  const variables = {
    patientName: payload.patientName || "Valued Patient",
    doctorName: payload.doctorName || "Dr. Rajesh Sharma",
    clinicName: payload.clinicName || "Sanjivani Dental Clinic",
    clinicPhone: payload.clinicPhone || "+91 98765 43210",
    appointmentDate: payload.date || "Scheduled Date",
    appointmentTime: payload.time || "Scheduled Time",
    invoiceNumber: payload.invoiceNumber || payload.invoiceId || "N/A",
    invoiceAmount: payload.invoiceAmount !== undefined ? String(payload.invoiceAmount) : "0",
    prescriptionDate: payload.date || new Date().toLocaleDateString("en-IN"),
    followUpDate: payload.followUpDate || "As advised",
    mediaUrl: payload.mediaUrl || "",
  };

  const key = `${payload.messageType}_whatsapp`;
  const templateStr = customTemplateBody || DEFAULT_TEMPLATES[key]?.body || payload.customText;

  if (templateStr) {
    return compileTemplate(templateStr, variables);
  }

  return `Hello ${variables.patientName},\n\nMessage from ${variables.clinicName}.`;
}

/**
 * Check monthly messaging quota in Firestore (messagingUsage collection).
 */
export async function getMonthlyMessagingQuota(clinicId?: string): Promise<{ allowed: boolean; messagesSent: number; monthlyLimit: number; monthKey: string }> {
  const now = new Date();
  const year = now.getFullYear();
  const monthStr = String(now.getMonth() + 1).padStart(2, "0");
  const monthKey = `quota_${year}_${monthStr}`;

  const quotaRef = doc(db, COLLECTIONS.MESSAGING_USAGE, monthKey);
  const snap = await getDoc(quotaRef);

  if (!snap.exists()) {
    const targetClinicId = clinicId || (typeof window !== "undefined" ? localStorage.getItem("clinicId") || undefined : undefined);

    // Initialize quota document for current month
    const initialQuota: MessagingQuotaInfo = {
      clinicId: targetClinicId || "",
      month: `${year}-${monthStr}`,
      monthlyLimit: DEFAULT_MONTHLY_QUOTA,
      messagesSent: 0,
      updatedAt: Timestamp.now(),
    };
    await setDoc(quotaRef, initialQuota);
    return { allowed: true, messagesSent: 0, monthlyLimit: DEFAULT_MONTHLY_QUOTA, monthKey };
  }

  const data = snap.data() as MessagingQuotaInfo;
  const messagesSent = data.messagesSent || 0;
  const monthlyLimit = data.monthlyLimit || DEFAULT_MONTHLY_QUOTA;

  return {
    allowed: messagesSent < monthlyLimit,
    messagesSent,
    monthlyLimit,
    monthKey,
  };
}

/**
 * Increment the monthly message counter after a successful send.
 */
export async function incrementQuotaCounter(monthKey: string): Promise<void> {
  try {
    const quotaRef = doc(db, COLLECTIONS.MESSAGING_USAGE, monthKey);
    await updateDoc(quotaRef, {
      messagesSent: increment(1),
      updatedAt: Timestamp.now(),
    });
  } catch (err) {
    console.warn("[WhatsAppService] Failed to increment quota counter:", err);
  }
}

/**
 * Remove fields with 'undefined' values before passing object to Firestore.
 */
function sanitizeFirestoreData<T extends Record<string, any>>(data: T): Partial<T> {
  const sanitized: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined) {
      sanitized[key] = data[key];
    }
  });
  return sanitized as Partial<T>;
}

/**
 * Create initial message log in 'queued' state.
 */
export async function createInitialWhatsAppLog(
  payload: WhatsAppMessagePayload
): Promise<string> {
  const clinicId = (payload as any).clinicId || (typeof window !== "undefined" ? localStorage.getItem("clinicId") || undefined : undefined);

  try {
    const logsRef = collection(db, COLLECTIONS.MESSAGE_LOGS);
    const newDocRef = doc(logsRef);
    const now = Timestamp.now();

    const logData = sanitizeFirestoreData({
      id: newDocRef.id,
      messageId: newDocRef.id,
      patientId: payload.patientId,
      encounterId: payload.encounterId,
      invoiceId: payload.invoiceId,
      appointmentId: payload.appointmentId,
      messageType: payload.messageType,
      recipient: payload.recipient,
      status: "queued",
      clinicId: clinicId || "",
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(newDocRef, logData);
    return newDocRef.id;
  } catch (err) {
    console.warn("[WhatsAppService] Failed to create initial message log:", err);
    return "";
  }
}

/**
 * Update an existing message log document by log ID.
 */
export async function updateWhatsAppLog(
  logId: string,
  updates: Partial<MessageLogEntry>
): Promise<void> {
  if (!logId) return;
  try {
    const logRef = doc(db, COLLECTIONS.MESSAGE_LOGS, logId);
    const sanitized = sanitizeFirestoreData({
      ...updates,
      updatedAt: Timestamp.now(),
    });
    await updateDoc(logRef, sanitized);
  } catch (err) {
    console.warn(`[WhatsAppService] Failed to update log ${logId}:`, err);
  }
}

/**
 * Update existing message log document by Twilio Message SID (used for Status Callbacks).
 * Prevents duplicate log creation.
 */
export async function updateWhatsAppLogBySid(
  twilioMessageSid: string,
  updates: Partial<MessageLogEntry>
): Promise<boolean> {
  if (!twilioMessageSid) return false;
  try {
    const logsRef = collection(db, COLLECTIONS.MESSAGE_LOGS);
    const q = query(logsRef, where("twilioMessageSid", "==", twilioMessageSid));
    const snap = await getDocs(q);

    if (snap.empty) {
      console.warn(`[WhatsAppService] No log document found for SID: ${twilioMessageSid}`);
      return false;
    }

    const targetDoc = snap.docs[0];
    const sanitized = sanitizeFirestoreData({
      ...updates,
      updatedAt: Timestamp.now(),
    });
    await updateDoc(targetDoc.ref, sanitized);

    return true;
  } catch (err) {
    console.warn(`[WhatsAppService] Failed to update log by SID ${twilioMessageSid}:`, err);
    return false;
  }
}

/**
 * Log message delivery attempt into Firestore (messageLogs collection).
 */
export async function logWhatsAppMessage(
  log: Omit<MessageLogEntry, "createdAt" | "updatedAt">
): Promise<string> {
  const clinicId = log.clinicId || (typeof window !== "undefined" ? localStorage.getItem("clinicId") || undefined : undefined);

  try {
    const logsRef = collection(db, COLLECTIONS.MESSAGE_LOGS);
    const newDocRef = doc(logsRef);
    const now = Timestamp.now();
    const logData = sanitizeFirestoreData({
      ...log,
      id: newDocRef.id,
      messageId: newDocRef.id,
      clinicId: clinicId || "",
      createdAt: now,
      updatedAt: now,
    });
    await setDoc(newDocRef, logData);
    return newDocRef.id;
  } catch (err) {
    console.warn("[WhatsAppService] Failed to log message:", err);
    return "";
  }
}

/**
 * Client-facing function to invoke the internal Next.js API route (/api/whatsapp/send).
 * Twilio credentials remain strictly protected on the server side.
 */
export async function sendWhatsAppMessage(
  payload: WhatsAppMessagePayload
): Promise<{ success: boolean; message: string; messageSid?: string; code?: string }> {
  try {
    const response = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        code: data.errorCode || data.code || "UNKNOWN_ERROR",
        message: data.message || data.error || "Failed to send WhatsApp message.",
      };
    }

    return {
      success: true,
      message: data.message || "WhatsApp message delivered successfully!",
      messageSid: data.messageSid,
    };
  } catch (err: any) {
    console.error("[sendWhatsAppMessage] Network error:", err);
    return {
      success: false,
      code: "TWILIO_NETWORK_ERROR",
      message: "Network error while connecting to messaging gateway. Please try again.",
    };
  }
}
