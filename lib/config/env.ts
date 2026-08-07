/**
 * Centralized Environment Variable Validation & Configuration
 *
 * Validates required environment variables during server/app initialization.
 * Fails fast with clear error reports if any required variable is missing or malformed.
 */

interface EnvSchema {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    whatsappNumber: string;
  };
  resend: {
    apiKey: string;
  };
  sentry: {
    dsn: string;
    environment: string;
    release: string;
  };
  appUrl: string;
}

interface ValidationError {
  key: string;
  reason: string;
}

function isValidUrl(val: string): boolean {
  try {
    const parsed = new URL(val);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateEnv(): EnvSchema {
  const errors: ValidationError[] = [];
  const isServer = typeof window === "undefined";

  // Helper to retrieve and trim env var
  const getVar = (key: string): string => {
    const val = process.env[key];
    return val ? val.trim() : "";
  };

  // ── 1. Firebase Public Variables (Required Client & Server) ──
  const firebaseApiKey = getVar("NEXT_PUBLIC_FIREBASE_API_KEY");
  const firebaseAuthDomain = getVar("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  const firebaseProjectId = getVar("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  const firebaseStorageBucket = getVar("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  const firebaseMessagingSenderId = getVar("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  const firebaseAppId = getVar("NEXT_PUBLIC_FIREBASE_APP_ID");

  if (!firebaseApiKey) errors.push({ key: "NEXT_PUBLIC_FIREBASE_API_KEY", reason: "Variable is missing or empty" });
  if (!firebaseAuthDomain) errors.push({ key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", reason: "Variable is missing or empty" });
  if (!firebaseProjectId) errors.push({ key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", reason: "Variable is missing or empty" });
  if (!firebaseStorageBucket) errors.push({ key: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", reason: "Variable is missing or empty" });
  if (!firebaseMessagingSenderId) errors.push({ key: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", reason: "Variable is missing or empty" });
  if (!firebaseAppId) errors.push({ key: "NEXT_PUBLIC_FIREBASE_APP_ID", reason: "Variable is missing or empty" });

  // ── 2. Application Base URL ──
  let appUrl = getVar("NEXT_PUBLIC_APP_URL");
  if (!appUrl) {
    appUrl = "http://localhost:3000";
  }
  if (!isValidUrl(appUrl)) {
    errors.push({ key: "NEXT_PUBLIC_APP_URL", reason: `Must be a valid HTTP/HTTPS URL (got "${appUrl}")` });
  }

  // ── 3. Server-Only Variables (Validated only on Server) ──
  let twilioAccountSid = getVar("TWILIO_ACCOUNT_SID");
  let twilioAuthToken = getVar("TWILIO_AUTH_TOKEN");
  let twilioWhatsAppNumber = getVar("TWILIO_WHATSAPP_NUMBER");
  let resendApiKey = getVar("RESEND_API_KEY");

  if (isServer) {
    if (!twilioAccountSid) {
      errors.push({ key: "TWILIO_ACCOUNT_SID", reason: "Variable is missing or empty" });
    } else if (!twilioAccountSid.startsWith("AC")) {
      errors.push({ key: "TWILIO_ACCOUNT_SID", reason: "Should start with 'AC'" });
    }

    if (!twilioAuthToken) {
      errors.push({ key: "TWILIO_AUTH_TOKEN", reason: "Variable is missing or empty" });
    }

    if (!twilioWhatsAppNumber) {
      errors.push({ key: "TWILIO_WHATSAPP_NUMBER", reason: "Variable is missing or empty" });
    } else if (!twilioWhatsAppNumber.startsWith("whatsapp:")) {
      errors.push({ key: "TWILIO_WHATSAPP_NUMBER", reason: "Should start with 'whatsapp:' (e.g. whatsapp:+14155238886)" });
    }

    if (!resendApiKey) {
      errors.push({ key: "RESEND_API_KEY", reason: "Variable is missing or empty" });
    }
  }

  // ── 4. Handle Validation Failures ──
  if (errors.length > 0) {
    const report = [
      "===================================",
      "Environment Validation Failed",
      "",
      "Missing / Invalid Variables:",
      ...errors.map((e) => `  • ${e.key}: ${e.reason}`),
      "",
      "Application startup aborted.",
      "===================================",
    ].join("\n");

    console.error(report);

    // Only throw hard startup error on the server to prevent crashing client bundles unnecessarily
    if (isServer) {
      throw new Error(`Environment validation failed. Missing/invalid: ${errors.map((e) => e.key).join(", ")}`);
    }
  }

  return {
    firebase: {
      apiKey: firebaseApiKey,
      authDomain: firebaseAuthDomain,
      projectId: firebaseProjectId,
      storageBucket: firebaseStorageBucket,
      messagingSenderId: firebaseMessagingSenderId,
      appId: firebaseAppId,
    },
    twilio: {
      accountSid: twilioAccountSid,
      authToken: twilioAuthToken,
      whatsappNumber: twilioWhatsAppNumber,
    },
    resend: {
      apiKey: resendApiKey,
    },
    sentry: {
      dsn: getVar("NEXT_PUBLIC_SENTRY_DSN") || getVar("SENTRY_DSN"),
      environment: getVar("SENTRY_ENVIRONMENT") || process.env.NODE_ENV || "development",
      release: getVar("SENTRY_RELEASE") || "denta-pure@1.0.0",
    },
    appUrl,
  };
}

// Evaluated once upon module load (singleton)
export const env: EnvSchema = validateEnv();
