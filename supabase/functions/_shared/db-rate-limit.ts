/**
 * Durable, database-backed rate limiting for Edge Functions.
 *
 * Unlike the in-memory limiter in `rate-limit.ts`, counters live in the
 * `rate_limit_counters` table so they are shared across every function
 * instance and survive cold starts. Each call costs one database round trip.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export interface RateLimitPolicy {
  /** Max requests allowed inside the window. */
  max: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

/** Named policies per endpoint class. */
export const DB_RATE_LIMITS = {
  /** Internal cron/scheduler endpoints — should run a handful of times per hour. */
  scheduler: { max: 10, windowSeconds: 300 },
  /** Outbound email / notification dispatch. */
  email: { max: 20, windowSeconds: 300 },
  /** Unauthenticated public forms (contact, guest order lookups). */
  publicForm: { max: 5, windowSeconds: 600 },
  /** Authenticated account-sensitive mutations. */
  sensitive: { max: 30, windowSeconds: 300 },
} as const satisfies Record<string, RateLimitPolicy>;

/** Stable per-caller identity: authenticated subject when present, else client IP. */
export function rateLimitIdentity(req: Request): string {
  const auth = req.headers.get("authorization");
  if (auth) {
    const token = auth.replace("Bearer ", "").trim();
    try {
      const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
      if (payload?.sub) return `sub:${payload.sub}`;
    } catch {
      // not a JWT (e.g. service role key) — fall through to a hashed token id
    }
    return `tok:${btoa(token).slice(0, 24)}`;
  }
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${fwd || req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "unknown"}`;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string | null;
}

/**
 * Consume one token from `<scope>:<identity>`.
 * Fails open (allows the request) only if the database itself is unreachable,
 * so a database blip cannot take down the endpoint.
 */
export async function consumeRateLimit(
  scope: string,
  req: Request,
  policy: RateLimitPolicy,
): Promise<RateLimitResult> {
  const bucketKey = `${scope}:${rateLimitIdentity(req)}`;
  try {
    const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data, error } = await client.rpc("consume_rate_limit", {
      _bucket_key: bucketKey,
      _max_requests: policy.max,
      _window_seconds: policy.windowSeconds,
    });
    if (error) {
      console.error(`[RATE-LIMIT] lookup failed for ${scope}: ${error.message}`);
      return { allowed: true, remaining: policy.max, resetAt: null };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      allowed: row?.allowed !== false,
      remaining: row?.remaining ?? 0,
      resetAt: row?.reset_at ?? null,
    };
  } catch (err) {
    console.error(`[RATE-LIMIT] unexpected error for ${scope}:`, err);
    return { allowed: true, remaining: policy.max, resetAt: null };
  }
}

export function tooManyRequests(
  corsHeaders: Record<string, string>,
  result: RateLimitResult,
  policy: RateLimitPolicy,
): Response {
  const retryAfter = result.resetAt
    ? Math.max(1, Math.ceil((new Date(result.resetAt).getTime() - Date.now()) / 1000))
    : policy.windowSeconds;
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
        "X-RateLimit-Limit": String(policy.max),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}

/**
 * Convenience guard: returns a 429 Response when the caller is over budget,
 * or null when the request may proceed.
 */
export async function enforceRateLimit(
  scope: string,
  req: Request,
  policy: RateLimitPolicy,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const result = await consumeRateLimit(scope, req, policy);
  if (result.allowed) return null;
  console.warn(`[RATE-LIMIT] blocked ${scope} for ${rateLimitIdentity(req)}`);
  return tooManyRequests(corsHeaders, result, policy);
}
