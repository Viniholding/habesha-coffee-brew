/**
 * Server-side audit logging for Edge Functions.
 *
 * Writes to `public.admin_audit_log` through the `log_audit_event` security
 * definer function (service role only), so entries can never be forged by a
 * client and can never be edited or deleted afterwards.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export type AuditActorType = "admin" | "user" | "system";

export interface AuditEventInput {
  actorType: AuditActorType;
  actorUserId?: string | null;
  actionType: string;
  entityType?: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  req?: Request;
}

function clientIp(req?: Request): string | undefined {
  if (!req) return undefined;
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    undefined
  );
}

/** Never throws — audit failures must not break the business action. */
export async function auditLog(event: AuditEventInput): Promise<void> {
  try {
    const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { error } = await client.rpc("log_audit_event", {
      _actor_type: event.actorType,
      _actor_user_id: event.actorUserId ?? null,
      _action_type: event.actionType,
      _entity_type: event.entityType ?? null,
      _entity_id: event.entityId ?? null,
      _old_values: event.oldValues ?? null,
      _new_values: event.newValues ?? null,
      _metadata: event.metadata ?? null,
      _ip_address: clientIp(event.req) ?? null,
      _user_agent: event.req?.headers.get("user-agent") ?? null,
    });
    if (error) console.error("[AUDIT] failed to write event:", error.message);
  } catch (err) {
    console.error("[AUDIT] unexpected error:", err);
  }
}

/** Records an outbound email/notification dispatch attempt. */
export async function auditEmailDispatch(params: {
  req?: Request;
  actorType?: AuditActorType;
  actorUserId?: string | null;
  emailType: string;
  recipient: string;
  entityType?: string;
  entityId?: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  // Store a redacted recipient so the audit trail is reviewable without
  // duplicating full contact details.
  const [local, domain] = params.recipient.split("@");
  const redacted = domain
    ? `${local.slice(0, 2)}***@${domain}`
    : `${params.recipient.slice(0, 2)}***`;

  await auditLog({
    actorType: params.actorType ?? "system",
    actorUserId: params.actorUserId ?? null,
    actionType: params.success ? "email_dispatched" : "email_dispatch_failed",
    entityType: params.entityType ?? "email",
    entityId: params.entityId,
    metadata: {
      email_type: params.emailType,
      recipient: redacted,
      success: params.success,
      ...(params.error ? { error: params.error.slice(0, 500) } : {}),
      ...params.metadata,
    },
    req: params.req,
  });
}

/** Records a scheduler/cron invocation and its outcome. */
export async function auditSchedulerRun(params: {
  req?: Request;
  jobName: string;
  success: boolean;
  results?: Record<string, unknown>;
  error?: string;
}): Promise<void> {
  await auditLog({
    actorType: "system",
    actionType: params.success ? "scheduler_run" : "scheduler_run_failed",
    entityType: "scheduler",
    entityId: params.jobName,
    metadata: {
      job: params.jobName,
      ...(params.results ?? {}),
      ...(params.error ? { error: params.error.slice(0, 500) } : {}),
    },
    req: params.req,
  });
}

/**
 * Drop-in replacement for `fetch("https://api.resend.com/emails", init)` that
 * records every dispatch attempt (recipient redacted) in the audit trail.
 */
export async function auditedResendFetch(
  emailType: string,
  init: RequestInit,
): Promise<Response> {
  let recipient = "unknown";
  let subject: string | undefined;
  try {
    const payload = JSON.parse(String(init.body ?? "{}"));
    const to = payload?.to;
    recipient = Array.isArray(to) ? to.join(", ") : String(to ?? "unknown");
    subject = typeof payload?.subject === "string" ? payload.subject.slice(0, 200) : undefined;
  } catch {
    // body was not JSON — keep defaults
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", init);
  } catch (err) {
    await auditEmailDispatch({
      emailType,
      recipient,
      success: false,
      error: err instanceof Error ? err.message : String(err),
      metadata: subject ? { subject } : undefined,
    });
    throw err;
  }

  await auditEmailDispatch({
    emailType,
    recipient,
    success: response.ok,
    error: response.ok ? undefined : `Resend responded ${response.status}`,
    metadata: { ...(subject ? { subject } : {}), status: response.status },
  });

  return response;
}
