import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';

interface PaymentFailureBannerProps {
  userId: string;
}

export default function PaymentFailureBanner({ userId }: PaymentFailureBannerProps) {
  const [hasFailedPayment, setHasFailedPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    checkPaymentStatus();
  }, [userId]);

  const checkPaymentStatus = async () => {
    try {
      // Check for past_due subscriptions
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .eq('status', 'past_due');

      setHasFailedPayment((subscriptions?.length || 0) > 0);
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading || !hasFailedPayment) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6 animate-in fade-in-50 slide-in-from-top-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Payment Failed</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <span>We were unable to process your subscription payment. Please update your payment method to continue receiving deliveries.</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={openCustomerPortal}
          disabled={portalLoading}
          className="whitespace-nowrap border-destructive/50 hover:bg-destructive/10"
        >
          {portalLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4 mr-2" />
          )}
          Update Payment Method
        </Button>
      </AlertDescription>
    </Alert>
  );
}
