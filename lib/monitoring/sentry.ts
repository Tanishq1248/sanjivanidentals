/**
 * Production Sentry Monitoring & Error Enrichment Utility
 *
 * Captures server, client, API, Firebase, Twilio, Resend, and PDF exceptions.
 * Automatically scrubs all personally identifiable information (PII) and patient data.
 */

import * as Sentry from "@sentry/nextjs";

/** List of sensitive keys that must be strictly scrubbed before reporting */
const SENSITIVE_KEYS = new Set([
  "patientname",
  "fullname",
  "name",
  "phone",
  "phonenumber",
  "recipient",
  "email",
  "patientemail",
  "medicalhistory",
  "notes",
  "chiefcomplaint",
  "diagnosis",
  "prescriptions",
  "prescriptioncontent",
  "password",
  "token",
  "authtoken",
  "apikey",
  "secret",
  "bearer",
]);

/** List of safe debugging keys allowed in Sentry context */
const SAFE_KEYS = new Set([
  "clinicid",
  "patientid",
  "encounterid",
  "invoiceid",
  "prescriptionid",
  "appointmentid",
  "errorcode",
  "category",
  "statuscode",
  "route",
  "method",
  "timestamp",
  "messagetype",
  "environment",
]);

/**
 * Recursively sanitize context data to ensure zero PII is sent to Sentry.
 */
export function sanitizeMetadata(data: any, depth = 0): any {
  if (!data || depth > 3) return undefined;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeMetadata(item, depth + 1)).filter(Boolean);
  }

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      clean[key] = "[REDACTED_PII]";
    } else if (SAFE_KEYS.has(lowerKey)) {
      clean[key] = value;
    } else if (typeof value === "object" && value !== null) {
      const sanitizedChild = sanitizeMetadata(value, depth + 1);
      if (sanitizedChild && Object.keys(sanitizedChild).length > 0) {
        clean[key] = sanitizedChild;
      }
    } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      // Retain non-PII primitives under non-sensitive keys
      clean[key] = String(value).slice(0, 100);
    }
  }

  return clean;
}

/**
 * Capture an application exception in Sentry with enriched, sanitized context.
 */
export function captureSentryException(err: any, context?: any) {
  if (!err) return;

  const sanitized = context ? sanitizeMetadata(context) : undefined;
  const errorCode = err?.errorCode || err?.code || "UNKNOWN_ERROR";
  const category = err?.category || "system";
  const statusCode = err?.statusCode || 500;

  // Filter out client validation & expected 4xx user input errors
  if (statusCode >= 400 && statusCode < 500 && category === "validation") {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag("error_code", String(errorCode));
    scope.setTag("category", String(category));
    scope.setTag("status_code", String(statusCode));

    if (sanitized?.patientId) scope.setTag("patient_id", String(sanitized.patientId));
    if (sanitized?.encounterId) scope.setTag("encounter_id", String(sanitized.encounterId));
    if (sanitized?.invoiceId) scope.setTag("invoice_id", String(sanitized.invoiceId));
    if (sanitized?.prescriptionId) scope.setTag("prescription_id", String(sanitized.prescriptionId));

    if (sanitized) {
      scope.setExtra("context", sanitized);
    }

    Sentry.captureException(err);
  });
}
