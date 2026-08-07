// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { env } from "./lib/config/env";

Sentry.init({
  dsn: env.sentry.dsn || process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment & Release Tracking
  environment: env.sentry.environment,
  release: env.sentry.release,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% sampling in production

  beforeSend(event) {
    // Sanitize request data to prevent accidental PII logging
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }
    return event;
  },
});
