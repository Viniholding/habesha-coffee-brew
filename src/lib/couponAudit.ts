import { supabase } from '@/integrations/supabase/client';

export type CouponAction = 'applied' | 'rejected';

export type CouponReasonCode = 
  | 'success'
  | 'invalid_code'
  | 'expired'
  | 'max_uses_exceeded'
  | 'not_subscription_eligible'
  | 'already_used'
  | 'account_restricted'
  | 'not_started'
  | 'min_order_not_met';

interface CouponAuditParams {
  userId: string;
  couponCode: string;
  action: CouponAction;
  reasonCode: CouponReasonCode;
  promotionId?: string;
  orderId?: string;
  subscriptionId?: string;
  discountAmount?: number;
  metadata?: Record<string, any>;
}

/**
 * Log coupon application or rejection for compliance tracking
 */
export async function logCouponAction({
  userId,
  couponCode,
  action,
  reasonCode,
  promotionId,
  orderId,
  subscriptionId,
  discountAmount,
  metadata,
}: CouponAuditParams): Promise<void> {
  try {
    await supabase.from('coupon_audit_log').insert({
      user_id: userId,
      coupon_code: couponCode.toUpperCase(),
      action,
      reason_code: reasonCode,
      promotion_id: promotionId,
      order_id: orderId,
      subscription_id: subscriptionId,
      discount_amount: discountAmount,
      metadata,
    });

    // If rejection, update account abuse tracking
    if (action === 'rejected') {
      await updateAbuseTracking(userId, 'coupon_rejection');
    }
  } catch (error) {
    console.error('Failed to log coupon action:', error);
  }
}

/**
 * Update account abuse tracking metrics
 */
export async function updateAbuseTracking(
  userId: string, 
  eventType: 'early_cancellation' | 'discount_reversal' | 'coupon_rejection' | 'pause_cycle'
): Promise<void> {
  try {
    // First, check if record exists
    const { data: existing } = await supabase
      .from('account_restrictions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const currentValues = existing || {
      abuse_score: 0,
      early_cancellations: 0,
      discount_reversals: 0,
      coupon_rejections: 0,
      pause_cycles: 0,
    };

    // Calculate new values based on event type
    const scoreIncrements: Record<string, number> = {
      early_cancellation: 25,
      discount_reversal: 30,
      coupon_rejection: 5,
      pause_cycle: 10,
    };

    const newScore = currentValues.abuse_score + (scoreIncrements[eventType] || 0);
    const updates: Record<string, any> = {
      abuse_score: newScore,
      last_abuse_check_at: new Date().toISOString(),
    };

    // Increment specific counter
    switch (eventType) {
      case 'early_cancellation':
        updates.early_cancellations = currentValues.early_cancellations + 1;
        break;
      case 'discount_reversal':
        updates.discount_reversals = currentValues.discount_reversals + 1;
        break;
      case 'coupon_rejection':
        updates.coupon_rejections = currentValues.coupon_rejections + 1;
        break;
      case 'pause_cycle':
        updates.pause_cycles = currentValues.pause_cycles + 1;
        break;
    }

    // Auto-restrict if score exceeds threshold
    if (newScore >= 100 && !existing?.is_promotional_restricted) {
      updates.is_promotional_restricted = true;
      updates.restriction_reason = 'Automatic restriction due to abuse score threshold';
      updates.restricted_at = new Date().toISOString();

      // Send notification emails (fire and forget)
      supabase.functions.invoke('send-abuse-notification', {
        body: {
          type: 'account_restricted',
          userId,
          reason: updates.restriction_reason,
          abuseScore: newScore,
        },
      }).catch((err) => {
        console.error('Failed to send abuse notification:', err);
      });
    }

    if (existing) {
      await supabase
        .from('account_restrictions')
        .update(updates)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('account_restrictions')
        .insert({
          user_id: userId,
          ...updates,
        });
    }
  } catch (error) {
    console.error('Failed to update abuse tracking:', error);
  }
}

/**
 * Check if account is restricted from promotional pricing
 */
export async function isAccountRestricted(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('account_restrictions')
      .select('is_promotional_restricted')
      .eq('user_id', userId)
      .maybeSingle();

    return data?.is_promotional_restricted || false;
  } catch (error) {
    console.error('Failed to check account restriction:', error);
    return false;
  }
}
