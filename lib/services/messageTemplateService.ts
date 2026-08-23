import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS, DEFAULT_CLINIC_ID } from "./firestoreConfig";
import { getClinicInfo } from "./clinicSettingsService";
import { FeatureAccessService, canEditCustomTemplates } from "./featureAccessService";
import type {
  MessageTemplate,
  MessageTemplatesDocument,
  MessageChannel,
  MessageTemplateType,
} from "../types";

/**
 * Standard Professional Default Templates for DentaPure.
 */
export const DEFAULT_TEMPLATES: Record<string, MessageTemplate> = {
  prescription_whatsapp: {
    id: "prescription_whatsapp",
    name: "Prescription WhatsApp Template",
    channel: "whatsapp",
    messageType: "prescription",
    body: `Hello {{patientName}},\n\nYour digital prescription from {{clinicName}} ({{doctorName}}) is ready.\n\n📄 View / Download Prescription:\n{{mediaUrl}}\n\nFollow-up Date: {{followUpDate}}\nIf you have any questions, please reach out at {{clinicPhone}}.\n\nThank you for choosing {{clinicName}}!`,
    status: "active",
  },
  invoice_whatsapp: {
    id: "invoice_whatsapp",
    name: "Invoice WhatsApp Template",
    channel: "whatsapp",
    messageType: "invoice",
    body: `Hello {{patientName}},\n\nHere is your treatment invoice #{{invoiceNumber}} from {{clinicName}}.\n\n💰 Total Amount: ₹{{invoiceAmount}}\n📄 View / Download Invoice:\n{{mediaUrl}}\n\nFor payment queries, contact {{clinicPhone}}.\n\nThank you for choosing {{clinicName}}!`,
    status: "active",
  },
  appointment_reminder_whatsapp: {
    id: "appointment_reminder_whatsapp",
    name: "Appointment Reminder WhatsApp Template",
    channel: "whatsapp",
    messageType: "appointment_reminder",
    body: `Hello {{patientName}},\n\nThis is a friendly reminder for your upcoming dental appointment at {{clinicName}}.\n\n📅 Date: {{appointmentDate}}\n⏰ Time: {{appointmentTime}}\n👨‍⚕️ Doctor: {{doctorName}}\n\nPlease arrive 10 minutes before your slot. Reply or call {{clinicPhone}} to reschedule.\n\nBest regards,\n{{clinicName}}`,
    status: "active",
  },
  prescription_email: {
    id: "prescription_email",
    name: "Prescription Email Template",
    channel: "email",
    messageType: "prescription",
    subject: "Digital Prescription - {{clinicName}}",
    body: `Dear {{patientName}},\n\nPlease find your digital prescription attached from {{clinicName}}.\n\nDoctor: {{doctorName}}\nPrescription Date: {{prescriptionDate}}\nFollow-up Date: {{followUpDate}}\n\nIf you experience any unusual symptoms or need clarification regarding your medication, please call us at {{clinicPhone}}.`,
    signature: "Warm regards,\n{{doctorName}}\n{{clinicName}}",
    footer: "Confidential Medical Record — Intended solely for {{patientName}}.",
    status: "active",
  },
  invoice_email: {
    id: "invoice_email",
    name: "Invoice Email Template",
    channel: "email",
    messageType: "invoice",
    subject: "Treatment Invoice #{{invoiceNumber}} - {{clinicName}}",
    body: `Dear {{patientName}},\n\nThank you for visiting {{clinicName}}.\n\nPlease find your detailed treatment invoice #{{invoiceNumber}} for ₹{{invoiceAmount}} attached to this email.\n\nIf you have any questions regarding your billing or payment receipts, please call {{clinicPhone}}.`,
    signature: "Best regards,\nAccounts & Billing Team\n{{clinicName}}",
    footer: "Thank you for trusting {{clinicName}} with your dental care.",
    status: "active",
  },
  appointment_reminder_email: {
    id: "appointment_reminder_email",
    name: "Appointment Reminder Email Template",
    channel: "email",
    messageType: "appointment_reminder",
    subject: "Upcoming Dental Appointment Reminder - {{clinicName}}",
    body: `Dear {{patientName}},\n\nThis is a gentle reminder for your scheduled appointment at {{clinicName}}.\n\nAppointment Details:\n- Date: {{appointmentDate}}\n- Time: {{appointmentTime}}\n- Doctor: {{doctorName}}\n\nIf you need to reschedule or cancel, please notify us at least 2 hours in advance at {{clinicPhone}}.`,
    signature: "Looking forward to seeing you,\n{{clinicName}} Care Team",
    footer: "{{clinicName}} — Excellence in Dental Care.",
    status: "active",
  },
};

// In-Memory Template Cache (Server & Client)
let cachedTemplates: MessageTemplatesDocument | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

/**
 * Replace placeholders like {{patientName}} with values from variables dictionary.
 */
export function compileTemplate(templateStr: string, variables: Record<string, any>): string {
  if (!templateStr) return "";
  let result = templateStr;

  Object.entries(variables).forEach(([key, val]) => {
    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    const replacement = val !== undefined && val !== null ? String(val) : "";
    result = result.replace(placeholder, replacement);
  });

  return result;
}

/**
 * Fetch message templates from Firestore (clinicSettings/templates doc).
 * Uses in-memory cache to eliminate unnecessary reads.
 */
export async function getMessageTemplates(forceRefresh = false): Promise<MessageTemplatesDocument> {
  const now = Date.now();

  if (!forceRefresh && cachedTemplates && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedTemplates;
  }

  try {
    const docRef = doc(db, COLLECTIONS.CLINIC_SETTINGS, "templates");
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data() as MessageTemplatesDocument;
      cachedTemplates = { ...DEFAULT_TEMPLATES, ...data };
    } else {
      cachedTemplates = { ...DEFAULT_TEMPLATES };
    }

    lastCacheTime = now;
    return cachedTemplates;
  } catch (err) {
    console.warn("[MessageTemplateService] Error fetching templates, using defaults:", err);
    return DEFAULT_TEMPLATES;
  }
}

/**
 * Save updated message templates into Firestore (clinicSettings/templates doc).
 */
export async function saveMessageTemplates(
  templates: MessageTemplatesDocument,
  updatedBy?: string
): Promise<boolean> {
  const clinicInfo = await getClinicInfo();
  if (!canEditCustomTemplates(clinicInfo)) {
    throw new Error(
      "Custom message template editing is available only in the Professional Plan. Please upgrade to customize templates."
    );
  }

  const sampleTemplate = Object.values(templates)[0];
  const clinicId = sampleTemplate?.clinicId;

  try {
    const docRef = doc(db, COLLECTIONS.CLINIC_SETTINGS, "templates");
    const now = Timestamp.now();

    const preparedData: Record<string, any> = { clinicId: clinicId || "" };
    Object.entries(templates).forEach(([id, t]) => {
      preparedData[id] = {
        ...t,
        clinicId: clinicId || "",
        updatedAt: now,
        updatedBy: updatedBy || t.updatedBy || "Admin",
      };
    });

    await setDoc(docRef, preparedData, { merge: true });

    // Update in-memory cache immediately
    cachedTemplates = preparedData;
    lastCacheTime = Date.now();
    return true;
  } catch (err) {
    console.error("[MessageTemplateService] Error saving templates:", err);
    return false;
  }
}

/**
 * Restore default templates for a specific template or all templates.
 */
export async function restoreDefaultTemplates(
  templateId?: string,
  updatedBy?: string
): Promise<MessageTemplatesDocument> {
  const current = await getMessageTemplates(true);

  let updated: MessageTemplatesDocument;
  if (templateId && DEFAULT_TEMPLATES[templateId]) {
    updated = {
      ...current,
      [templateId]: { ...DEFAULT_TEMPLATES[templateId] },
    };
  } else {
    updated = { ...DEFAULT_TEMPLATES };
  }

  await saveMessageTemplates(updated, updatedBy);
  return updated;
}

/**
 * Helper to retrieve a single compiled message body given channel, type, and variables.
 */
export async function getCompiledTemplate(
  messageType: MessageTemplateType,
  channel: MessageChannel,
  variables: Record<string, any>
): Promise<{ subject?: string; body: string; signature?: string; footer?: string }> {
  const templates = await getMessageTemplates();
  const key = `${messageType}_${channel}`;
  const template = templates[key] || DEFAULT_TEMPLATES[key];

  if (!template) {
    return { body: "" };
  }

  return {
    subject: template.subject ? compileTemplate(template.subject, variables) : undefined,
    body: compileTemplate(template.body, variables),
    signature: template.signature ? compileTemplate(template.signature, variables) : undefined,
    footer: template.footer ? compileTemplate(template.footer, variables) : undefined,
  };
}
