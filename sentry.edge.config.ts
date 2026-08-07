// This file configures the initialization of Sentry for Edge features (middleware, edge routes).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { env } from "./lib/config/env";

Sentry.init({
  dsn: env.sentry.dsn || process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: env.sentry.environment,
  release: env.sentry.release,
  tracesSampleRate: 0.1,
});
