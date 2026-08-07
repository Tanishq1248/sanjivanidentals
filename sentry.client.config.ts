// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { env } from "./lib/config/env";

Sentry.init({
  dsn: env.sentry.dsn || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment & Release Tracking
  environment: env.sentry.environment,
  release: env.sentry.release,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% sampling in production

  // Ignore noisy expected client side errors
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "NetworkError when attempting to fetch resource",
    "User rejected request",
  ],

  beforeSend(event) {
    // Ensure zero PII or tokens are leaked in URLs or request headers
    if (event.request) {
      if (event.request.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
      if (event.request.cookies) {
        delete event.request.cookies;
      }
    }
    return event;
  },
});
