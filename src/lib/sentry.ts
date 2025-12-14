import * as Sentry from "@sentry/react";

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.log("[Sentry] No DSN configured, error tracking disabled");
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    // Session replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
    
    environment: import.meta.env.MODE,
    
    // Filter out non-error console logs
    beforeSend(event) {
      // Don't send events in development
      if (import.meta.env.DEV) {
        console.log("[Sentry] Would send event:", event);
        return null;
      }
      return event;
    },
  });

  console.log("[Sentry] Initialized successfully");
};

// Helper to capture exceptions with context
export const captureError = (error: Error, context?: Record<string, unknown>) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

// Helper to set user context
export const setUserContext = (userId: string, email?: string) => {
  Sentry.setUser({
    id: userId,
    email,
  });
};

// Clear user context on logout
export const clearUserContext = () => {
  Sentry.setUser(null);
};

export { Sentry };
