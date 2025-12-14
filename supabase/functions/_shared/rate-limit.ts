/**
 * Simple in-memory rate limiting for Edge Functions
 * Uses a sliding window algorithm with IP-based tracking
 */

interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// In-memory store (resets on function cold start)
const requestStore = new Map<string, RequestRecord>();

// Default configs for different endpoint types
export const RATE_LIMITS = {
  auth: { windowMs: 60000, maxRequests: 10 },      // 10 requests per minute for auth endpoints
  api: { windowMs: 60000, maxRequests: 60 },       // 60 requests per minute for general API
  webhook: { windowMs: 1000, maxRequests: 100 },   // 100 requests per second for webhooks
  email: { windowMs: 60000, maxRequests: 10 },     // 10 emails per minute
  checkout: { windowMs: 60000, maxRequests: 20 },  // 20 checkout attempts per minute
  scheduler: { windowMs: 60000, maxRequests: 5 },  // 5 scheduler runs per minute
} as const;

/**
 * Get client identifier from request
 */
export function getClientId(req: Request): string {
  // Try to get real IP from common headers
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  
  // Use first IP from forwarded chain, or fallback to other headers
  const ip = (forwardedFor?.split(",")[0]?.trim()) || realIp || cfConnectingIp || "unknown";
  
  // Include authorization header hash for authenticated requests
  const auth = req.headers.get("authorization");
  if (auth) {
    // Simple hash of auth token
    const authHash = btoa(auth).substring(0, 16);
    return `${ip}:${authHash}`;
  }
  
  return ip;
}

/**
 * Check if request should be rate limited
 * Returns null if allowed, or an error Response if rate limited
 */
export function checkRateLimit(
  clientId: string,
  config: RateLimitConfig,
  corsHeaders: Record<string, string>
): Response | null {
  const now = Date.now();
  const record = requestStore.get(clientId);

  if (!record || now > record.resetTime) {
    // New window - reset count
    requestStore.set(clientId, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return null; // Allow request
  }

  if (record.count >= config.maxRequests) {
    // Rate limited
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return new Response(
      JSON.stringify({
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(record.resetTime),
        },
      }
    );
  }

  // Increment count
  record.count++;
  requestStore.set(clientId, record);
  return null; // Allow request
}

/**
 * Add rate limit headers to successful responses
 */
export function addRateLimitHeaders(
  headers: Record<string, string>,
  clientId: string,
  config: RateLimitConfig
): Record<string, string> {
  const record = requestStore.get(clientId);
  if (record) {
    return {
      ...headers,
      "X-RateLimit-Limit": String(config.maxRequests),
      "X-RateLimit-Remaining": String(Math.max(0, config.maxRequests - record.count)),
      "X-RateLimit-Reset": String(record.resetTime),
    };
  }
  return headers;
}

/**
 * Cleanup old entries periodically (call this occasionally to prevent memory leaks)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, record] of requestStore.entries()) {
    if (now > record.resetTime) {
      requestStore.delete(key);
    }
  }
}

/**
 * Utility function to create a rate-limited handler wrapper
 */
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  config: RateLimitConfig,
  corsHeaders: Record<string, string>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const clientId = getClientId(req);
    const rateLimitResponse = checkRateLimit(clientId, config, corsHeaders);
    
    if (rateLimitResponse) {
      console.log(`[RATE-LIMIT] Blocked request from ${clientId}`);
      return rateLimitResponse;
    }

    // Periodically cleanup (1% of requests)
    if (Math.random() < 0.01) {
      cleanupExpiredEntries();
    }

    return handler(req);
  };
}
