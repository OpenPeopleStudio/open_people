import * as Sentry from "@sentry/nextjs";
import { getRequestContext } from "@/lib/observability/logger";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  // Before send hook to add context from request
  beforeSend(event, hint) {
    try {
      const context = getRequestContext();
      if (context) {
        event.tags = event.tags || {};
        event.tags.correlationId = context.correlationId;
        event.tags.tenantId = context.tenantId;
        event.tags.userId = context.userId;
        event.tags.requestId = context.requestId;

        event.user = event.user || {};
        if (context.userId) event.user.id = context.userId;
        if (context.tenantId) event.user.tenant_id = context.tenantId;
      }
    } catch (error) {
      // Don't let context extraction break error reporting
      console.warn('Failed to add context to Sentry event:', error);
    }

    return event;
  },

  // Performance monitoring
  integrations: [
    Sentry.httpIntegration(),
    Sentry.nativeNodeFetchIntegration(),
    Sentry.graphqlIntegration(),
    Sentry.mongoIntegration(),
    Sentry.postgresIntegration(),
  ],
});