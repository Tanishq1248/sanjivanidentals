import { NextResponse } from "next/server";
import twilio from "twilio";
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { COLLECTIONS } from "../../../../lib/services/firestoreConfig";
import {
  formatE164,
  validateWhatsAppPhone,
  generateWhatsAppMessageBody,
  checkQuotaStatus,
  incrementQuotaCounter,
  createInitialWhatsAppLog,
  updateWhatsAppLog,
  logWhatsAppMessage,
} from "../../../../lib/services/whatsappService";
import { getMessageTemplates } from "../../../../lib/services/messageTemplateService";
import {
  createErrorResponse,
  createSuccessResponse,
  logServerError,
} from "../../../../lib/errors/messagingErrors";
import type {
  WhatsAppMessagePayload,
  Prescription,
  Invoice,
  Appointment,
  ClinicBasicInfo,
} from "../../../../lib/types";

// In-Memory Request Lock Set (Server-Side Final Authority)
const activeWhatsAppLocks = new Set<string>();

/**
 * Generate a unique lock key for duplicate request detection.
 */
function getLockKey(payload: WhatsAppMessagePayload): string {
  const pId = payload.patientId || "unknown_patient";
  const type = payload.messageType || "general";
  const target =
    payload.encounterId ||
    payload.invoiceId ||
    payload.appointmentId ||
    payload.recipient ||
    "default";
  return `${pId}_${type}_${target}`;
}

/**
 * Helper to delay execution for exponential backoff.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper to check if a URL is publicly accessible by Twilio media crawler.
 * Twilio rejects local URLs (localhost, 127.0.0.1, internal IPs).
 */
function isValidPublicMediaUrl(urlStr?: string): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;
  const lower = urlStr.toLowerCase();

  if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
    return false;
  }

  if (
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.includes("0.0.0.0") ||
    lower.includes("::1") ||
    lower.includes(".local")
  ) {
    return false;
  }

  return true;
}

/**
 * Classify if an error is temporary/transient (eligible for retry).
 */
function isTransientError(error: any): boolean {
  if (!error) return false;

  const status = error.status || error.statusCode || error.response?.status;
  const code = String(error.code || "").toUpperCase();
  const message = String(error.message || "").toLowerCase();

  // Permanent Client/Payload errors (400 Bad Request, Invalid Media URL, Invalid Phone)
  if (
    status === 400 ||
    code.includes("21620") ||
    code.includes("21614") ||
    code.includes("21211") ||
    message.includes("invalid media url")
  ) {
    return false;
  }

  if (status && [500, 502, 503, 504].includes(status)) {
    return true;
  }

  if (status === 429 && !error.message?.includes("Monthly WhatsApp limit")) {
    return true;
  }



  const transientCodes = [
    "ETIMEDOUT",
    "ECONNRESET",
    "ECONNREFUSED",
    "ENOTFOUND",
    "EHOSTUNREACH",
    "ESOCKETTIMEDOUT",
    "EPIPE",
  ];

  if (transientCodes.some((tc) => code.includes(tc))) {
    return true;
  }

  if (
    message.includes("timeout") ||
    message.includes("econnreset") ||
    message.includes("network error") ||
    message.includes("socket hang up") ||
    message.includes("service unavailable") ||
    message.includes("gateway timeout") ||
    message.includes("temporarily unavailable")
  ) {
    return true;
  }

  return false;
}

export async function POST(req: Request) {
  let lockKey = "";

  try {
    const payload: WhatsAppMessagePayload = await req.json();

    // ── 1. SERVER-SIDE REQUEST LOCKING (DUPLICATE SEND PROTECTION) ──
    lockKey = getLockKey(payload);

    if (activeWhatsAppLocks.has(lockKey)) {
      return createErrorResponse(
        "MESSAGE_ALREADY_PROCESSING",
        "This WhatsApp message is already being processed.",
        "Duplicate request rejected by backend lock.",
        { lockKey }
      );
    }

    // Acquire lock
    activeWhatsAppLocks.add(lockKey);

    // Emergency auto-release fallback (20 seconds)
    const timeoutHandle = setTimeout(() => {
      activeWhatsAppLocks.delete(lockKey);
    }, 20000);

    // Determine request origin for absolute PDF URLs
    const origin = req.headers.get("origin") || req.headers.get("host") || "http://localhost:3000";
    const baseUrl = origin.startsWith("http") ? origin : `https://${origin}`;

    let recipient = payload.recipient;
    let patientId = payload.patientId;
    let patientName = payload.patientName;
    let clinicName = payload.clinicName;
    let doctorName = payload.doctorName;
    let date = payload.date;
    let time = payload.time;
    let mediaUrl = payload.mediaUrl;

    // ── 2. SERVER-SIDE DATA LOAD FROM FIRESTORE ──
    try {
      const clinicSnap = await getDoc(doc(db, COLLECTIONS.CLINIC_SETTINGS, "info"));
      if (clinicSnap.exists()) {
        const cData = clinicSnap.data() as ClinicBasicInfo;
        clinicName = clinicName || cData.clinicName;
        doctorName = doctorName || cData.doctorName;
      }
    } catch (err: any) {
      logServerError(err, { action: "Fetch Clinic Info" });
    }

    if (payload.messageType === "prescription") {
      let rxDocId = payload.encounterId;

      if (payload.encounterId) {
        const rxQuery = query(
          collection(db, COLLECTIONS.PRESCRIPTIONS),
          where("encounterId", "==", payload.encounterId)
        );
        const rxSnap = await getDocs(rxQuery);
        if (!rxSnap.empty) {
          const rxData = rxSnap.docs[0].data() as Prescription;
          rxDocId = rxSnap.docs[0].id;
          patientId = patientId || rxData.patientId;
          patientName = patientName || rxData.patientName;
          recipient = recipient || rxData.patientPhone;
          doctorName = doctorName || rxData.doctorName;
        }
      }

      if (rxDocId && !rxDocId.startsWith("temp")) {
        mediaUrl = mediaUrl || `${baseUrl}/api/pdf/prescription?id=${rxDocId}`;
      }
    } else if (payload.messageType === "invoice" && payload.invoiceId) {
      const invSnap = await getDoc(doc(db, COLLECTIONS.INVOICES, payload.invoiceId));
      if (invSnap.exists()) {
        const invData = invSnap.data() as Invoice;
        patientId = patientId || invData.patientId || "";
        patientName = patientName || invData.patientName || "Patient";
        mediaUrl = mediaUrl || `${baseUrl}/api/pdf/invoice?id=${payload.invoiceId}`;
      }
    } else if (payload.messageType === "appointment_reminder" && payload.appointmentId) {
      const aptSnap = await getDoc(doc(db, COLLECTIONS.APPOINTMENTS, payload.appointmentId));
      if (aptSnap.exists()) {
        const aptData = aptSnap.data() as Appointment;
        patientId = patientId || aptData.patientId || "";
        patientName = patientName || aptData.patientName || "Patient";
        date = date || aptData.date;
        time = time || aptData.time;
        doctorName = doctorName || aptData.doctorName;
      }
    }

    // ── 3. INPUT VALIDATION ──
    if (!recipient || !patientId || !payload.messageType) {
      return createErrorResponse(
        "PHONE_NOT_FOUND",
        "Missing required message parameters (recipient, patientId, messageType).",
        "Validation failed for payload fields."
      );
    }

    // ── 4. PHONE NUMBER FORMAT VALIDATION ──
    if (!validateWhatsAppPhone(recipient)) {
      await logWhatsAppMessage({
        patientId,
        encounterId: payload.encounterId,
        invoiceId: payload.invoiceId,
        appointmentId: payload.appointmentId,
        messageType: payload.messageType,
        recipient,
        status: "failed",
        errorMessage: "Invalid phone number format.",
      });

      return createErrorResponse(
        "PHONE_FORMAT_INVALID",
        "The patient's WhatsApp number is invalid. Please check the phone number.",
        `Invalid phone format provided: ${recipient}`
      );
    }

    // ── 5. MONTHLY QUOTA CHECK ──
    const quota = await checkQuotaStatus();
    if (!quota.allowed) {
      await logWhatsAppMessage({
        patientId,
        encounterId: payload.encounterId,
        invoiceId: payload.invoiceId,
        appointmentId: payload.appointmentId,
        messageType: payload.messageType,
        recipient,
        status: "quota_exceeded",
        errorMessage: `Monthly limit reached (${quota.messagesSent}/${quota.monthlyLimit}).`,
      });

      return createErrorResponse(
        "MESSAGE_LIMIT_REACHED",
        `Monthly WhatsApp message limit of 500 messages has been reached.`,
        `Quota exceeded: ${quota.messagesSent}/${quota.monthlyLimit}`
      );
    }

    // ── 6. TWILIO CREDENTIALS CHECK ──
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

    const isPlaceholder =
      !accountSid ||
      !authToken ||
      accountSid.includes("xxxxxxxx") ||
      authToken.includes("your_twilio");

    if (isPlaceholder) {
      await logWhatsAppMessage({
        patientId,
        encounterId: payload.encounterId,
        invoiceId: payload.invoiceId,
        appointmentId: payload.appointmentId,
        messageType: payload.messageType,
        recipient,
        status: "failed",
        errorMessage: "Twilio credentials not configured in environment.",
      });

      return createErrorResponse(
        "INVALID_CONFIGURATION",
        "Messaging service is not properly configured. Please contact administration.",
        "TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing or placeholder."
      );
    }

    // Format recipient to Twilio WhatsApp E.164
    const e164Phone = formatE164(recipient);
    const toWhatsApp = e164Phone.startsWith("whatsapp:") ? e164Phone : `whatsapp:${e164Phone}`;
    const fromWhatsApp = twilioWhatsAppNumber.startsWith("whatsapp:")
      ? twilioWhatsAppNumber
      : `whatsapp:${twilioWhatsAppNumber}`;

    // Generate Message Body using Centralized Configured Template
    const templates = await getMessageTemplates();
    const templateKey = `${payload.messageType}_whatsapp`;
    const configuredBody = templates[templateKey]?.body;

    const messageBody = generateWhatsAppMessageBody(
      {
        ...payload,
        recipient: e164Phone,
        patientId,
        patientName,
        clinicName,
        doctorName,
        date,
        time,
      },
      configuredBody
    );

    // ── 7. LIFECYCLE LOGGING: QUEUED & SENDING ──
    const initialLogId = await createInitialWhatsAppLog({
      ...payload,
      recipient,
      patientId,
    });

    if (initialLogId) {
      await updateWhatsAppLog(initialLogId, { status: "sending" });
    }

    const client = twilio(accountSid, authToken);
    const statusCallbackUrl = `${baseUrl}/api/whatsapp/status`;

    const messageParams: any = {
      from: fromWhatsApp,
      to: toWhatsApp,
      body: messageBody,
      statusCallback: statusCallbackUrl,
    };

    if (mediaUrl && isValidPublicMediaUrl(mediaUrl)) {
      messageParams.mediaUrl = [mediaUrl];
    } else if (mediaUrl) {
      console.warn(
        `[Twilio Notice] Excluded mediaUrl '${mediaUrl}' from Twilio request because localhost/non-public URLs cannot be fetched by Twilio cloud servers.`
      );
    }

    // ── 8. RETRY MECHANISM WITH EXPONENTIAL BACKOFF ──
    const MAX_ATTEMPTS = 3;
    let attempt = 0;
    let twilioResponse: any = null;
    let lastError: any = null;

    for (attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        twilioResponse = await client.messages.create(messageParams);
        break;
      } catch (err: any) {
        lastError = err;
        logServerError(err, { attempt, recipient: e164Phone });

        const canRetry = isTransientError(err);
        if (!canRetry || attempt === MAX_ATTEMPTS) {
          break;
        }

        const backoffMs = attempt * 1000;
        await delay(backoffMs);
      }
    }

    // Release emergency handle
    clearTimeout(timeoutHandle);

    if (twilioResponse) {
      // ── SUCCESSFUL SEND ──
      await incrementQuotaCounter(quota.monthKey);

      const sentTime = Timestamp.now();
      if (initialLogId) {
        await updateWhatsAppLog(initialLogId, {
          status: "sent",
          twilioMessageSid: twilioResponse.sid,
          recipient: e164Phone,
          attemptCount: attempt,
          sentAt: sentTime,
          lastAttemptAt: sentTime,
        });
      } else {
        await logWhatsAppMessage({
          patientId,
          encounterId: payload.encounterId,
          invoiceId: payload.invoiceId,
          appointmentId: payload.appointmentId,
          messageType: payload.messageType,
          recipient: e164Phone,
          twilioMessageSid: twilioResponse.sid,
          status: "sent",
          attemptCount: attempt,
          sentAt: sentTime,
          lastAttemptAt: sentTime,
        });
      }

      return createSuccessResponse("WhatsApp message delivered successfully!", undefined, twilioResponse.sid);
    } else {
      // ── FAILED SEND AFTER RETRIES ──
      const failTime = Timestamp.now();
      if (initialLogId) {
        await updateWhatsAppLog(initialLogId, {
          status: "failed",
          failedAt: failTime,
          lastAttemptAt: failTime,
          attemptCount: attempt,
          errorCode: lastError?.code || "SEND_FAILED",
          errorMessage: lastError?.message || "Failed after retries.",
        });
      } else {
        await logWhatsAppMessage({
          patientId,
          encounterId: payload.encounterId,
          invoiceId: payload.invoiceId,
          appointmentId: payload.appointmentId,
          messageType: payload.messageType,
          recipient: e164Phone,
          status: "failed",
          attemptCount: attempt,
          failedAt: failTime,
          lastAttemptAt: failTime,
          errorMessage: lastError?.message || "Failed after retries.",
        });
      }

      return createErrorResponse(
        "RETRY_LIMIT_EXCEEDED",
        "Unable to send WhatsApp message. Please try again later.",
        lastError?.message || "All retry attempts failed."
      );
    }
  } catch (error: any) {
    logServerError(error, { route: "/api/whatsapp/send" });

    return createErrorResponse(
      "UNKNOWN_ERROR",
      "Unable to send WhatsApp message. Please try again later.",
      error?.message
    );
  } finally {
    if (lockKey) {
      activeWhatsAppLocks.delete(lockKey);
    }
  }
}
