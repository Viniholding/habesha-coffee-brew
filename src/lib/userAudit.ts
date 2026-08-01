import { supabase } from '@/integrations/supabase/client';

/**
 * User-sensitive action types recorded for post-deployment access review.
 * Entries are written by the `log_user_action` security-definer function,
 * which always stamps the acting user from the verified session — a client
 * can never forge the actor.
 */
export type UserAuditActionType =
  | 'order_placed'
  | 'order_issue_reported'
  | 'order_tracking_viewed'
  | 'subscription_created'
  | 'subscription_modified'
  | 'subscription_cancelled'
  | 'stock_notification_requested'
  | 'address_changed'
  | 'payment_method_changed';

interface UserAuditParams {
  actionType: UserAuditActionType;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/** Fire-and-forget: audit failures must never block the user's action. */
export async function logUserAction({
  actionType,
  entityType,
  entityId,
  metadata,
}: UserAuditParams): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return; // anonymous actions are audited server-side instead

    await supabase.rpc('log_user_action', {
      _action_type: actionType,
      _entity_type: entityType ?? null,
      _entity_id: entityId ?? null,
      _metadata: (metadata ?? null) as never,
    });
  } catch (error) {
    console.error('Failed to record user action:', error);
  }
}
