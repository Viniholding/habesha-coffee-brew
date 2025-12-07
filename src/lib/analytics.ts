import { supabase } from '@/integrations/supabase/client';

export type AnalyticsEventType =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'checkout_step'
  | 'purchase'
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'subscription_paused'
  | 'subscription_resumed'
  | 'subscription_renewed';

interface EventData {
  product_id?: string;
  product_name?: string;
  quantity?: number;
  price?: number;
  order_id?: string;
  total?: number;
  items?: any[];
  step?: number;
  step_name?: string;
  subscription_id?: string;
  page?: string;
  [key: string]: any;
}

// Generate or get session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export const trackEvent = async (
  eventType: AnalyticsEventType,
  eventData: EventData = {}
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = getSessionId();

    await supabase.from('analytics_events').insert({
      user_id: user?.id || null,
      session_id: sessionId,
      event_type: eventType,
      event_data: eventData,
    });
  } catch (error) {
    // Silently fail - don't disrupt user experience for analytics
    console.error('Analytics tracking error:', error);
  }
};

// Convenience methods
export const trackPageView = (page: string) => 
  trackEvent('page_view', { page });

export const trackProductView = (productId: string, productName: string, price: number) =>
  trackEvent('product_view', { product_id: productId, product_name: productName, price });

export const trackAddToCart = (productId: string, productName: string, quantity: number, price: number) =>
  trackEvent('add_to_cart', { product_id: productId, product_name: productName, quantity, price });

export const trackRemoveFromCart = (productId: string, productName: string, quantity: number) =>
  trackEvent('remove_from_cart', { product_id: productId, product_name: productName, quantity });

export const trackBeginCheckout = (cartValue: number, items: any[]) =>
  trackEvent('begin_checkout', { total: cartValue, items });

export const trackCheckoutStep = (step: number, stepName: string) =>
  trackEvent('checkout_step', { step, step_name: stepName });

export const trackPurchase = (orderId: string, total: number, items: any[]) =>
  trackEvent('purchase', { order_id: orderId, total, items });

export const trackSubscriptionCreated = (subscriptionId: string, productName: string, price: number) =>
  trackEvent('subscription_created', { subscription_id: subscriptionId, product_name: productName, price });

export const trackSubscriptionCancelled = (subscriptionId: string) =>
  trackEvent('subscription_cancelled', { subscription_id: subscriptionId });

export const trackSubscriptionPaused = (subscriptionId: string) =>
  trackEvent('subscription_paused', { subscription_id: subscriptionId });

export const trackSubscriptionResumed = (subscriptionId: string) =>
  trackEvent('subscription_resumed', { subscription_id: subscriptionId });
