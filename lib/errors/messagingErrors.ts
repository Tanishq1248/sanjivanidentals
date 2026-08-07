import { NextResponse } from "next/server";

export type ErrorCategory =
  | "validation"
  | "patient"
  | "messaging"
  | "twilio"
  | "firestore"
  | "pdf"
  | "auth"
  | "system";

export type MessagingErrorCode =
  | "PATIENT_NOT_FOUND"
  | "PRESCRIPTION_NOT_FOUND"
  | "STORAGE_PATH_MISSING"
  | "STORAGE_FILE_MISSING"
  | "DOWNLOAD_URL_FAILED"
  | "INVALID_DOCUMENT"
  | "PHONE_NOT_FOUND"
  | "PHONE_INVALID"
  | "PHONE_FORMAT_INVALID"
  | "COUNTRY_CODE_INVALID"
  | "TWILIO_AUTH_ERROR"
  | "TWILIO_NETWORK_ERROR"
  | "TWILIO_TIMEOUT"
  | "TWILIO_SERVER_ERROR"
  | "MESSAGE_LIMIT_REACHED"
  | "PDF_GENERATION_FAILED"
  | "MESSAGE_ALREADY_PROCESSING"
  | "DELIVERY_FAILED"
  | "RETRY_LIMIT_EXCEEDED"
  | "INVALID_CONFIGURATION"
  | "FIRESTORE_READ_FAILED"
  | "FIRESTORE_WRITE_FAILED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "UNKNOWN_ERROR";

export interface ErrorDefinition {
  category: ErrorCategory;
  defaultMessage: string;
  statusCode: number;
}

export const ERROR_DEFINITIONS: Record<MessagingErrorCode, ErrorDefinition> = {
  PATIENT_NOT_FOUND: {
    category: "patient",
    defaultMessage: "Patient record could not be found.",
    statusCode: 404,
  },
  PRESCRIPTION_NOT_FOUND: {
    category: "pdf",
    defaultMessage: "Prescription record could not be found.",
    statusCode: 404,
  },
  STORAGE_PATH_MISSING: {
    category: "pdf",
    defaultMessage: "Storage reference path is missing in document metadata.",
    statusCode: 404,
  },
  STORAGE_FILE_MISSING: {
    category: "pdf",
    defaultMessage: "The requested document file is missing from Firebase Storage.",
    statusCode: 404,
  },
  DOWNLOAD_URL_FAILED: {
    category: "pdf",
    defaultMessage: "Failed to generate secure Firebase Storage download URL.",
    statusCode: 500,
  },
  INVALID_DOCUMENT: {
    category: "pdf",
    defaultMessage: "The stored document file is corrupted or invalid.",
    statusCode: 422,
  },
  PHONE_NOT_FOUND: {
    category: "validation",
    defaultMessage: "Patient does not have a registered phone number.",
    statusCode: 400,
  },
  PHONE_INVALID: {
    category: "validation",
    defaultMessage: "The patient's WhatsApp number is invalid. Please check the phone number.",
    statusCode: 422,
  },
  PHONE_FORMAT_INVALID: {
    category: "validation",
    defaultMessage: "Phone number format is invalid. Please use a valid 10-digit or E.164 number.",
    statusCode: 400,
  },
  COUNTRY_CODE_INVALID: {
    category: "validation",
    defaultMessage: "Invalid or unsupported country code.",
    statusCode: 422,
  },
  TWILIO_AUTH_ERROR: {
    category: "twilio",
    defaultMessage: "Messaging service authentication failed. Please check clinic configuration.",
    statusCode: 503,
  },
  TWILIO_NETWORK_ERROR: {
    category: "twilio",
    defaultMessage: "WhatsApp service connection error. Please try again shortly.",
    statusCode: 503,
  },
  TWILIO_TIMEOUT: {
    category: "twilio",
    defaultMessage: "WhatsApp service timed out. Please try again in a moment.",
    statusCode: 503,
  },
  TWILIO_SERVER_ERROR: {
    category: "twilio",
    defaultMessage: "WhatsApp gateway error. Please try again shortly.",
    statusCode: 503,
  },
  MESSAGE_LIMIT_REACHED: {
    category: "messaging",
    defaultMessage: "Monthly WhatsApp message limit of 500 messages has been reached.",
    statusCode: 429,
  },
  PDF_GENERATION_FAILED: {
    category: "pdf",
    defaultMessage: "Unable to generate document PDF. Please verify patient data.",
    statusCode: 500,
  },
  MESSAGE_ALREADY_PROCESSING: {
    category: "messaging",
    defaultMessage: "This WhatsApp message is already being processed.",
    statusCode: 409,
  },
  DELIVERY_FAILED: {
    category: "messaging",
    defaultMessage: "Unable to deliver WhatsApp message. Please try again later.",
    statusCode: 500,
  },
  RETRY_LIMIT_EXCEEDED: {
    category: "messaging",
    defaultMessage: "Unable to send WhatsApp message after multiple retries. Please try again later.",
    statusCode: 503,
  },
  INVALID_CONFIGURATION: {
    category: "system",
    defaultMessage: "Messaging configuration is missing or incomplete.",
    statusCode: 400,
  },
  FIRESTORE_READ_FAILED: {
    category: "firestore",
    defaultMessage: "Unable to retrieve clinical record. Please refresh and try again.",
    statusCode: 500,
  },
  FIRESTORE_WRITE_FAILED: {
    category: "firestore",
    defaultMessage: "Unable to update message history. Please try again.",
    statusCode: 500,
  },
  UNAUTHORIZED: {
    category: "auth",
    defaultMessage: "Authentication required to access messaging service.",
    statusCode: 401,
  },
  FORBIDDEN: {
    category: "auth",
    defaultMessage: "You do not have permission to send WhatsApp messages.",
    statusCode: 403,
  },
  UNKNOWN_ERROR: {
    category: "system",
    defaultMessage: "An unexpected error occurred while sending WhatsApp message.",
    statusCode: 500,
  },
};

export class MessagingError extends Error {
  public readonly errorCode: MessagingErrorCode;
  public readonly category: ErrorCategory;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly technicalMessage?: string;
  public readonly context?: any;

  constructor(
    errorCode: MessagingErrorCode,
    customUserMessage?: string,
    technicalMessage?: string,
    context?: any
  ) {
    const definition = ERROR_DEFINITIONS[errorCode] || ERROR_DEFINITIONS.UNKNOWN_ERROR;
    const userMsg = customUserMessage || definition.defaultMessage;
    super(userMsg);

    this.name = "MessagingError";
    this.errorCode = errorCode;
    this.category = definition.category;
    this.statusCode = definition.statusCode;
    this.userMessage = userMsg;
    this.technicalMessage = technicalMessage;
    this.context = context;
  }
}

/**
 * Standard API Response Shape
 */
export interface StandardSuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
  messageSid?: string;
}

export interface StandardErrorResponse {
  success: false;
  errorCode: MessagingErrorCode;
  message: string;
  timestamp: string;
}

import { captureSentryException } from "../monitoring/sentry";

/**
 * Centralized Server Error Logger.
 * Logs full technical details, context, stack traces on server without exposing to client,
 * and automatically captures production exceptions in Sentry with sanitized PII.
 */
export function logServerError(err: MessagingError | Error | any, context?: any) {
  const timestamp = new Date().toISOString();

  // 1. Report exception to Sentry (sanitizes context and strips PII automatically)
  try {
    captureSentryException(err, context);
  } catch (sentryErr) {
    console.error("[SENTRY_CAPTURE_FAILED]", sentryErr);
  }

  // 2. Local console logging
  if (err instanceof MessagingError) {
    console.error(`[MESSAGING_ERROR ${timestamp}] Code: ${err.errorCode} (${err.category}) | UserMsg: "${err.userMessage}" | TechMsg: "${err.technicalMessage || 'None'}"`, {
      context: err.context || context,
      stack: err.stack,
    });
  } else {
    console.error(`[MESSAGING_ERROR ${timestamp}] Code: UNKNOWN_ERROR | RawMessage: "${err?.message || err}"`, {
      context,
      error: err,
      stack: err?.stack,
    });
  }
}

/**
 * Centralized API Error Response Helper for Next.js Route Handlers.
 */
export function createErrorResponse(
  errorCode: MessagingErrorCode,
  customUserMessage?: string,
  technicalMessage?: string,
  context?: any
): NextResponse<StandardErrorResponse> {
  const err = new MessagingError(errorCode, customUserMessage, technicalMessage, context);

  // Server-side logging
  logServerError(err);

  // Return clean, standardized client response (no technical details)
  return NextResponse.json(
    {
      success: false,
      errorCode: err.errorCode,
      message: err.userMessage,
      timestamp: new Date().toISOString(),
    },
    { status: err.statusCode }
  );
}

/**
 * Centralized API Success Response Helper.
 */
export function createSuccessResponse<T = any>(
  message: string,
  data?: T,
  messageSid?: string
): NextResponse<StandardSuccessResponse<T>> {
  const body: StandardSuccessResponse<T> = {
    success: true,
    message,
  };

  if (data !== undefined) body.data = data;
  if (messageSid) body.messageSid = messageSid;

  return NextResponse.json(body, { status: 200 });
}
