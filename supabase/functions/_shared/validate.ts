/**
 * Strict request-body validation helpers for Edge Functions.
 *
 * These run *after* authentication so that even an authenticated or internal
 * caller cannot submit oversized, malformed, or unexpected payloads.
 */

const MAX_BODY_BYTES = 64 * 1024; // 64 KB — no endpoint here needs more

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function badRequest(corsHeaders: Record<string, string>, message: string): Response {
  return new Response(JSON.stringify({ error: "Invalid request", message }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Parses a JSON body with a hard size cap and object-shape check. */
export async function parseJsonBody(req: Request): Promise<Record<string, unknown>> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ValidationError("Content-Type must be application/json");
  }
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    throw new ValidationError("Request body too large");
  }
  if (!raw.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ValidationError("Body is not valid JSON");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new ValidationError("Body must be a JSON object");
  }
  return parsed as Record<string, unknown>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function requireUuid(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw new ValidationError(`"${field}" must be a valid UUID`);
  }
  return value;
}

export function optionalUuid(body: Record<string, unknown>, field: string): string | undefined {
  if (body[field] === undefined || body[field] === null) return undefined;
  return requireUuid(body, field);
}

export function requireString(
  body: Record<string, unknown>,
  field: string,
  opts: { min?: number; max?: number } = {},
): string {
  const { min = 1, max = 500 } = opts;
  const value = body[field];
  if (typeof value !== "string") throw new ValidationError(`"${field}" must be a string`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw new ValidationError(`"${field}" is required`);
  if (trimmed.length > max) throw new ValidationError(`"${field}" must be at most ${max} characters`);
  return trimmed;
}

export function optionalString(
  body: Record<string, unknown>,
  field: string,
  opts: { max?: number } = {},
): string | undefined {
  if (body[field] === undefined || body[field] === null || body[field] === "") return undefined;
  return requireString(body, field, { min: 0, max: opts.max ?? 500 });
}

export function requireEnum<T extends string>(
  body: Record<string, unknown>,
  field: string,
  allowed: readonly T[],
): T {
  const value = body[field];
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ValidationError(`"${field}" must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

export function requireEmail(body: Record<string, unknown>, field: string): string {
  const value = requireString(body, field, { max: 255 }).toLowerCase();
  if (!EMAIL_RE.test(value)) throw new ValidationError(`"${field}" must be a valid email address`);
  return value;
}

export function optionalEmail(body: Record<string, unknown>, field: string): string | undefined {
  if (body[field] === undefined || body[field] === null || body[field] === "") return undefined;
  return requireEmail(body, field);
}

export function optionalInt(
  body: Record<string, unknown>,
  field: string,
  opts: { min?: number; max?: number } = {},
): number | undefined {
  if (body[field] === undefined || body[field] === null) return undefined;
  const value = Number(body[field]);
  if (!Number.isInteger(value)) throw new ValidationError(`"${field}" must be an integer`);
  if (opts.min !== undefined && value < opts.min) throw new ValidationError(`"${field}" must be >= ${opts.min}`);
  if (opts.max !== undefined && value > opts.max) throw new ValidationError(`"${field}" must be <= ${opts.max}`);
  return value;
}

/** Rejects unknown top-level keys so payload shape stays locked down. */
export function rejectUnknownKeys(body: Record<string, unknown>, allowed: readonly string[]): void {
  const extra = Object.keys(body).filter((k) => !allowed.includes(k));
  if (extra.length > 0) {
    throw new ValidationError(`Unexpected field(s): ${extra.join(", ")}`);
  }
}

/** Wraps a handler body so ValidationError becomes a clean 400. */
export function handleValidationError(
  err: unknown,
  corsHeaders: Record<string, string>,
): Response | null {
  if (err instanceof ValidationError) return badRequest(corsHeaders, err.message);
  return null;
}
