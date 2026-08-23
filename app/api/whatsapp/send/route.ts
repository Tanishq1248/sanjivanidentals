import { NextResponse } from "next/server";
import twilio from "twilio";
import { adminDb } from "../../../../lib/server/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { COLLECTIONS } from "../../../../lib/services/firestoreConfig";
import {
  formatE164,
  validateWhatsAppPhone,
  generateWhatsAppMessageBody,
  getMonthlyMessagingQuota,
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
import { generatePrescriptionPdfBuffer } from "../../../../lib/services/pdfServerService";
import { DocumentStorageService } from "../../../../lib/services/documentStorageService";
import { getClinicSettings } from "../../../../lib/services/clinicSettingsService";
import { env } from "../../../../lib/config/env";
import type {
  WhatsAppMessagePayload,
  Prescription,
  Invoice,
  Appointment,
  ClinicBasicInfo,
  DocumentMetadataRecord,
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

/**
 * Server-side helper to ensure a prescription PDF is stored in Firebase Storage and return its download URL.
 * Leverages DocumentStorageService.getOrEnsurePrescriptionPdf to reuse existing Storage PDFs cleanly.
 */
async function getOrGeneratePrescriptionStorageUrl(
  rxDocId: string,
  rxData: Prescription,
  clinicInfo?: ClinicBasicInfo
): Promise<string | null> {
  try {
    const { downloadUrl, reused } = await DocumentStorageService.getOrEnsurePrescriptionPdf(
      rxDocId,
      rxData,
      clinicInfo
    );

    if (reused) {
      console.log(`[WhatsApp API] Reused existing stored PDF for WhatsApp delivery (ID: ${rxDocId})`);
    } else {
      console.log(`[WhatsApp API] Initialized and uploaded PDF for WhatsApp delivery (ID: ${rxDocId})`);
    }

    return downloadUrl;
  } catch (error: any) {
    logServerError(error, { action: "getOrGeneratePrescriptionStorageUrl", rxDocId });
    return null;
  }
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
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (() => {
        const host = req.headers.get("x-forwarded-host") ||
          req.headers.get("host") || "localhost:3000";
        const proto = req.headers.get("x-forwarded-proto") || "https";
        return `${proto}://${host}`;
      })();

    let recipient = payload.recipient;
    let patientId = payload.patientId;
    let patientName = payload.patientName;
    let clinicName = payload.clinicName;
    let doctorName = payload.doctorName;
    let date = payload.date;
    let time = payload.time;
    let mediaUrl = payload.mediaUrl;

    // ── 2. SERVER-SIDE DATA LOAD FROM FIRESTORE ──
    let clinicInfo: ClinicBasicInfo | undefined;
    try {
      const settings = await getClinicSettings();
      clinicInfo = settings;
      clinicName = clinicName || settings.clinicName;
      doctorName = doctorName || settings.leadDoctorName || settings.doctorName;
    } catch (err: any) {
      logServerError(err, { action: "Fetch Clinic Info" });
    }

    if (payload.messageType === "prescription") {
      let rxDocId = payload.prescriptionId || payload.encounterId;
      let rxData: Prescription | null = null;

      // 1. Primary Lookup: Try finding prescription document by prescriptionId
      if (payload.prescriptionId && !payload.prescriptionId.startsWith("temp")) {
        try {
          const rxSnap = await adminDb.collection(COLLECTIONS.PRESCRIPTIONS).doc(payload.prescriptionId).get();
          if (rxSnap.exists) {
            rxData = { prescriptionId: rxSnap.id, ...rxSnap.data() } as Prescription;
            rxDocId = rxSnap.id;
          }
        } catch (err: any) {
          logServerError(err, { action: "Fetch Prescription by ID", prescriptionId: payload.prescriptionId });
        }
      }

      // 2. Secondary Lookup: Fallback to finding prescription document by encounterId
      if (!rxData && payload.encounterId) {
        try {
          const rxSnap = await adminDb
            .collection(COLLECTIONS.PRESCRIPTIONS)
            .where("encounterId", "==", payload.encounterId)
            .get();
          if (!rxSnap.empty) {
            const docSnap = rxSnap.docs[0];
            rxData = { prescriptionId: docSnap.id, ...docSnap.data() } as Prescription;
            rxDocId = docSnap.id;
          }
        } catch (err: any) {
          logServerError(err, { action: "Fetch Prescription by Encounter", encounterId: payload.encounterId });
        }
      }

      if (!rxData || !rxDocId || rxDocId.startsWith("temp")) {
        console.warn(
          `[WhatsApp API] Download URL generation failed: Prescription record not found in Firestore (prescriptionId: ${payload.prescriptionId}, encounterId: ${payload.encounterId})`
        );
        await logWhatsAppMessage({
          patientId: patientId || "unknown",
          encounterId: payload.encounterId,
          messageType: payload.messageType,
          recipient: recipient || "unknown",
          status: "failed",
          errorMessage: "Prescription record not found in Firestore.",
        });

        return createErrorResponse(
          "PRESCRIPTION_NOT_FOUND",
          "The requested prescription document could not be found in Firestore.",
          `No matching prescription record for ID '${payload.prescriptionId || payload.encounterId}'.`
        );
      }

      patientId = patientId || rxData.patientId;
      patientName = patientName || rxData.patientName;
      recipient = recipient || rxData.patientPhone;
      doctorName = doctorName || rxData.doctorName;

      // 3. Extract storagePath from prescription or central 'documents' collection
      let storagePath = rxData.storagePath;
      if (!storagePath) {
        try {
          const docMetaSnap = await adminDb.collection(COLLECTIONS.DOCUMENTS).doc(rxDocId).get();
          if (docMetaSnap.exists) {
            const docMeta = docMetaSnap.data() as DocumentMetadataRecord;
            if (docMeta.storagePath && docMeta.status !== "deleted") {
              storagePath = docMeta.storagePath;
            }
          }
        } catch (metaErr) {
          console.warn(`[WhatsApp API] Could not read documents metadata for ${rxDocId}:`, metaErr);
        }
      }

      // If storagePath is missing: Abort sending and return structured error
      if (!storagePath) {
        console.warn(`[WhatsApp API] Download URL generation failed: storagePath missing for prescription ${rxDocId}`);
        await logWhatsAppMessage({
          patientId,
          encounterId: payload.encounterId,
          messageType: payload.messageType,
          recipient: recipient || "unknown",
          status: "failed",
          errorMessage: "storagePath is missing in prescription metadata.",
        });

        return createErrorResponse(
          "STORAGE_PATH_MISSING",
          "Prescription PDF storage path reference is missing. Please view or print the prescription first to upload it to Storage.",
          `No storagePath found for prescription ID '${rxDocId}'.`
        );
      }

      // 4. Generate fresh Download URL via DocumentStorageService.getDownloadURL(storagePath)
      try {
        console.log(`[WhatsApp API] Storage file located at path for prescription ${rxDocId}`);
        const downloadUrl = await DocumentStorageService.getDownloadURL(storagePath);
        mediaUrl = downloadUrl;
        console.log(`[WhatsApp API] Download URL generated successfully for prescription ${rxDocId}`);
        console.log(`[WhatsApp API] Twilio mediaUrl prepared successfully for recipient`);
        console.log(`[WhatsApp API] WhatsApp message delivery initiated for patient ${patientId}`);
      } catch (storageError: any) {
        const errMsg = storageError?.message || "";
        console.error(`[WhatsApp API] Download URL generation failed for path '${storagePath}':`, storageError);

        await logWhatsAppMessage({
          patientId,
          encounterId: payload.encounterId,
          messageType: payload.messageType,
          recipient: recipient || "unknown",
          status: "failed",
          errorMessage: `Download URL generation failed: ${errMsg}`,
        });

        if (errMsg.includes("STORAGE_FILE_MISSING")) {
          return createErrorResponse(
            "STORAGE_FILE_MISSING",
            "The prescription PDF file is missing from Firebase Storage. Please view or print the prescription to restore it.",
            `Storage file not found at path '${storagePath}'.`
          );
        }

        if (errMsg.includes("CORRUPTED_FILE") || errMsg.includes("INVALID_MIME_TYPE")) {
          return createErrorResponse(
            "INVALID_DOCUMENT",
            "The prescription PDF file in Firebase Storage is corrupted or invalid.",
            `Invalid file at path '${storagePath}'.`
          );
        }

        return createErrorResponse(
          "DOWNLOAD_URL_FAILED",
          "Unable to generate secure download URL for prescription PDF delivery.",
          errMsg
        );
      }
    } else if (payload.messageType === "invoice") {
      let invDocId = payload.invoiceId;
      let invData: Invoice | null = null;

      if (invDocId) {
        try {
          const invSnap = await adminDb.collection(COLLECTIONS.INVOICES).doc(invDocId).get();
          if (invSnap.exists) {
            invData = { id: invSnap.id, ...invSnap.data() } as Invoice;
          }
        } catch (err: any) {
          logServerError(err, { action: "Fetch Invoice by ID", invoiceId: invDocId });
        }
      }

      if (!invData || !invDocId) {
        console.warn(
          `[WhatsApp API] Download URL generation failed: Invoice record not found in Firestore (invoiceId: ${payload.invoiceId})`
        );
        await logWhatsAppMessage({
          patientId: patientId || "unknown",
          invoiceId: payload.invoiceId,
          messageType: payload.messageType,
          recipient: recipient || "unknown",
          status: "failed",
          errorMessage: "Invoice record not found in Firestore.",
        });

        return createErrorResponse(
          "PATIENT_NOT_FOUND",
          "The requested invoice document could not be found in Firestore.",
          `No matching invoice record for ID '${payload.invoiceId}'.`
        );
      }

      patientId = patientId || invData.patientId || "";
      patientName = patientName || invData.patientName || "Patient";

      // Retrieve or generate Invoice PDF in Firebase Storage and get server-generated Download URL
      try {
        const { downloadUrl, reused } = await DocumentStorageService.getOrEnsureInvoicePdf(
          invDocId,
          invData,
          clinicInfo
        );

        if (reused) {
          console.log(`[WhatsApp API] Reused existing stored Invoice PDF for WhatsApp delivery (ID: ${invDocId})`);
        } else {
          console.log(`[WhatsApp API] Initialized and uploaded Invoice PDF for WhatsApp delivery (ID: ${invDocId})`);
        }

        mediaUrl = downloadUrl;
        console.log(`[WhatsApp API] Download URL generated successfully for invoice ${invDocId}`);
        console.log(`[WhatsApp API] Twilio mediaUrl prepared successfully for invoice recipient`);
      } catch (storageError: any) {
        const errMsg = storageError?.message || "";
        console.error(`[WhatsApp API] Download URL generation failed for invoice '${invDocId}':`, storageError);

        await logWhatsAppMessage({
          patientId,
          invoiceId: invDocId,
          messageType: payload.messageType,
          recipient: recipient || "unknown",
          status: "failed",
          errorMessage: `Invoice Download URL generation failed: ${errMsg}`,
        });

        return createErrorResponse(
          "DOWNLOAD_URL_FAILED",
          "Unable to generate secure download URL for Invoice PDF delivery.",
          errMsg
        );
      }
    } else if (payload.messageType === "appointment_reminder" && payload.appointmentId) {
      const aptSnap = await adminDb.collection(COLLECTIONS.APPOINTMENTS).doc(payload.appointmentId).get();
      if (aptSnap.exists) {
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
    const clinicId = (payload as any).clinicId || clinicInfo?.clinicId || "default";
    const quota = await getMonthlyMessagingQuota(clinicId);
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
    const accountSid = env.twilio.accountSid;
    const authToken = env.twilio.authToken;
    const twilioWhatsAppNumber = env.twilio.whatsappNumber;

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

    // Detect sandbox vs production Twilio number
    const isSandbox = fromWhatsApp.includes("14155238886");

    const messageParams: any = {
      from: fromWhatsApp,
      to: toWhatsApp,
      body: messageBody,
      statusCallback: statusCallbackUrl,
    };

    // Only attach media on production number
    // Twilio Sandbox does not support PDF/media attachments
    if (
      !isSandbox &&
      mediaUrl &&
      isValidPublicMediaUrl(mediaUrl) &&
      payload.messageType !== "appointment_reminder"
    ) {
      messageParams.mediaUrl = [mediaUrl];
    } else if (mediaUrl && !isSandbox) {
      console.warn(
        `[Twilio Notice] Excluded mediaUrl '${mediaUrl}' from Twilio request because localhost/non-public URLs cannot be fetched by Twilio cloud servers.`
      );
    }

    // For sandbox: append download link to message body instead
    if (
      isSandbox &&
      mediaUrl &&
      isValidPublicMediaUrl(mediaUrl) &&
      payload.messageType !== "appointment_reminder"
    ) {
      messageParams.body = `${messageBody}\n\n📄 View Document:\n${mediaUrl}`;
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

      const sentTime = Timestamp.now() as any;
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
      const failTime = Timestamp.now() as any;
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
