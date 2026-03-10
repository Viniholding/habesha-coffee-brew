import { supabase } from '@/integrations/supabase/client';

export type AuditActionType = 
  | 'admin_user_created'
  | 'admin_role_updated'
  | 'admin_activated'
  | 'admin_deactivated'
  | 'admin_password_reset'
  | 'product_created'
  | 'product_updated'
  | 'inventory_updated'
  | 'order_updated'
  | 'order_tracking_updated'
  | 'subscription_updated'
  | 'promotion_created'
  | 'promotion_updated'
  | 'settings_updated'
  | 'collection_updated'
  | 'homepage_updated'
  | 'account_restricted'
  | 'account_unrestricted';

interface AuditLogParams {
  actionType: AuditActionType;
  entityType?: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
}

export async function logAdminAction({
  actionType,
  entityType,
  entityId,
  oldValues,
  newValues,
  metadata,
}: AuditLogParams): Promise<void> {
  try {
    await supabase.rpc('insert_admin_audit_log', {
      _action_type: actionType,
      _entity_type: entityType || null,
      _entity_id: entityId || null,
      _old_values: oldValues || null,
      _new_values: newValues || null,
      _metadata: metadata || null,
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}
