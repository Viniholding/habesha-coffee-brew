import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionStatusSyncProps {
  subscriptionId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

const SubscriptionStatusSync = ({ 
  subscriptionId, 
  currentStatus, 
  onStatusChange 
}: SubscriptionStatusSyncProps) => {
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  useEffect(() => {
    // Set up real-time subscription for status changes
    const channel = supabase
      .channel(`subscription-${subscriptionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'subscriptions',
          filter: `id=eq.${subscriptionId}`,
        },
        (payload) => {
          const newStatus = (payload.new as any).status;
          if (newStatus !== currentStatus) {
            onStatusChange?.(newStatus);
          }
          setLastSynced(new Date());
          setSyncStatus('synced');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subscriptionId, currentStatus, onStatusChange]);

  const formatLastSynced = () => {
    if (!lastSynced) return 'Just now';
    const seconds = Math.floor((new Date().getTime() - lastSynced.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={cn(
          "text-xs flex items-center gap-1",
          syncStatus === 'synced' && "text-primary border-primary/20",
          syncStatus === 'syncing' && "text-muted-foreground border-border",
          syncStatus === 'error' && "text-destructive border-destructive/20"
        )}
      >
        {syncStatus === 'synced' && <Check className="h-3 w-3" />}
        {syncStatus === 'syncing' && <Loader2 className="h-3 w-3 animate-spin" />}
        {syncStatus === 'error' && <AlertCircle className="h-3 w-3" />}
        <span className="hidden sm:inline">
          {syncStatus === 'synced' && 'Live'}
          {syncStatus === 'syncing' && 'Syncing...'}
          {syncStatus === 'error' && 'Sync error'}
        </span>
      </Badge>
      <span className="text-xs text-muted-foreground hidden md:inline">
        {formatLastSynced()}
      </span>
    </div>
  );
};

export default SubscriptionStatusSync;
