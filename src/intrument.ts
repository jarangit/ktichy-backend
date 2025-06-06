// Import with `const Sentry = require("@sentry/nestjs");` if you are using CJS
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% performance sampling
  sampleRate: 1.0, // Error sampling 100%
  sendDefaultPii: true,
});
