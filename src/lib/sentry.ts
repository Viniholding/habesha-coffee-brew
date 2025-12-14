import { supabase } from "@/integrations/supabase/client";

/**
 * Error monitoring with backend logging
 */

// Send error to backend endpoint
const sendErrorToBackend = async (error: Error, context?: Record<string, unknown>) => {
  try {
    await supabase.functions.invoke("log-error", {
      body: {
        message: error.message,
        stack: error.stack,
        context,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (e) {
    // Silently fail - don't cause more errors trying to log errors
    if (import.meta.env.DEV) {
      console.warn("[Error Logger] Failed to send error to backend:", e);
    }
  }
};

// Capture and log errors
export const captureError = (error: Error, context?: Record<string, unknown>) => {
  if (import.meta.env.DEV) {
    console.error("[Error Captured]", error, context);
  }
  
  // Send to backend in both dev and prod
  sendErrorToBackend(error, context);
};

// Global error handler setup
export const initErrorTracking = () => {
  if (typeof window !== "undefined") {
    window.onerror = (message, source, lineno, colno, error) => {
      captureError(error || new Error(String(message)), {
        source,
        lineno,
        colno,
        type: "window.onerror",
      });
      return false;
    };

    window.onunhandledrejection = (event) => {
      captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: "unhandledrejection" }
      );
    };
  }
};
