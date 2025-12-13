import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AdminLevel = 'owner' | 'manager' | 'support' | null;

export const useAdminRole = () => {
  const [adminLevel, setAdminLevel] = useState<AdminLevel>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminLevel();
  }, []);

  const checkAdminLevel = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setAdminLevel(null);
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('admin_level')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (data) {
        // Default to 'manager' if admin_level is null but user has admin role
        const level = data.admin_level as AdminLevel;
        setAdminLevel(level || 'manager');
        console.log('[useAdminRole] Admin level found:', level || 'manager (default)');
      } else {
        setAdminLevel(null);
        console.log('[useAdminRole] No admin role found for user');
      }
    } catch (error) {
      console.error('Error checking admin level:', error);
      setAdminLevel(null);
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = adminLevel === 'owner';
  const isManager = adminLevel === 'manager' || adminLevel === 'owner';
  const isSupport = adminLevel === 'support';
  const canEdit = adminLevel === 'owner' || adminLevel === 'manager';
  const isReadOnly = adminLevel === 'support';

  return {
    adminLevel,
    isLoading,
    isOwner,
    isManager,
    isSupport,
    canEdit,
    isReadOnly,
  };
};
