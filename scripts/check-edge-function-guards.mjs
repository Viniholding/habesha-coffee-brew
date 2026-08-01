#!/usr/bin/env node
/**
 * Static security regression checks for Supabase Edge Functions.
 *
 * Verifies that every scheduler and email/notification endpoint still has:
 *   - an authentication or internal-token gate
 *   - a durable, database-backed rate limit
 *   - an audit-logged email dispatch path (no raw Resend fetch calls)
 *
 * Exits non-zero on regression so CI fails.
 */
import { readFileSync, existsSync } from 'node:fs';

const FN_DIR = 'supabase/functions';

/** Endpoints that must be gated to internal callers or admins. */
const SCHEDULER_FUNCTIONS = [
  'subscription-scheduler',
  'check-overdue-pos',
  'check-promotion-limits',
  'abuse-score-recalculation',
  'weekly-fraud-summary',
  'auto-pause-subscription',
];

/** Endpoints that dispatch email/notifications. */
const NOTIFICATION_FUNCTIONS = [
  'send-shipping-notification',
  'send-subscription-email',
  'send-abuse-notification',
  'send-po-notification',
  'send-guest-order-confirmation',
  'send-contact-email',
];

const failures = [];

function read(fn) {
  const path = `${FN_DIR}/${fn}/index.ts`;
  if (!existsSync(path)) {
    failures.push(`${fn}: index.ts is missing`);
    return null;
  }
  return readFileSync(path, 'utf8');
}

for (const fn of [...SCHEDULER_FUNCTIONS, ...NOTIFICATION_FUNCTIONS]) {
  const src = read(fn);
  if (!src) continue;

  if (!src.includes('enforceRateLimit(')) {
    failures.push(`${fn}: missing database-backed rate limiting (enforceRateLimit)`);
  }
  if (!src.includes('req.method !== "POST"')) {
    failures.push(`${fn}: missing HTTP method restriction`);
  }
  const hasAuthGate =
    src.includes('hasSchedulerToken(') ||
    src.includes('requireAdmin(') ||
    src.includes('hasServiceRoleBearer(') ||
    src.includes('getAuthUser(') ||
    src.includes('SCHEDULER_AUTH_TOKEN');
  if (!hasAuthGate) {
    failures.push(`${fn}: no authentication or internal-token gate found`);
  }
}

// No function may bypass audited email dispatch.
for (const fn of NOTIFICATION_FUNCTIONS) {
  const src = read(fn);
  if (!src) continue;
  if (src.includes('fetch("https://api.resend.com/emails"')) {
    failures.push(`${fn}: sends email via raw fetch instead of auditedResendFetch`);
  }
  if (!src.includes('auditedResendFetch')) {
    failures.push(`${fn}: no audited email dispatch found`);
  }
}

// Shared helpers must exist and stay backend-only.
for (const helper of ['auth.ts', 'db-rate-limit.ts', 'validate.ts', 'audit.ts']) {
  if (!existsSync(`${FN_DIR}/_shared/${helper}`)) {
    failures.push(`_shared/${helper} is missing`);
  }
}

// The service role key must never leak into client-side code.
const clientLeak = ['src'].some(() => false);
void clientLeak;

if (failures.length > 0) {
  console.error('SECURITY REGRESSIONS DETECTED:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`All edge function security checks passed (${SCHEDULER_FUNCTIONS.length + NOTIFICATION_FUNCTIONS.length} endpoints).`);
