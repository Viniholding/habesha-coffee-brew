import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

export const serviceClient = () => createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

/** Escape untrusted values before embedding them in HTML emails. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Returns true when the request carries the internal scheduler token. */
export function hasSchedulerToken(req: Request): boolean {
  const expected = Deno.env.get("SCHEDULER_AUTH_TOKEN");
  if (!expected) return false;
  const provided = req.headers.get("x-scheduler-token");
  if (!provided) return false;
  return provided === expected;
}

/** Returns true when the caller presents the service role key as bearer token. */
export function hasServiceRoleBearer(req: Request): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  return !!SERVICE_ROLE_KEY && token === SERVICE_ROLE_KEY;
}

/** Validates the caller JWT and returns the authenticated user (or null). */
export async function getAuthUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token || token === SERVICE_ROLE_KEY || token === ANON_KEY) return null;
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

/** Validates the caller JWT and confirms an active admin role. */
export async function requireAdmin(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return null;
  const { data, error } = await serviceClient().rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (error || !data) return null;
  return user;
}

export function unauthorized(corsHeaders: Record<string, string>, message = "Unauthorized") {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function forbidden(corsHeaders: Record<string, string>, message = "Forbidden") {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
