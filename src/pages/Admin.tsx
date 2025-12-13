import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { InventoryManagement } from '@/components/admin/InventoryManagement';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { OrderManagement } from '@/components/admin/OrderManagement';
import AdminSubscriptionManagement from '@/components/admin/SubscriptionManagement';
import SubscriptionAnalytics from '@/components/admin/SubscriptionAnalytics';
import PromotionsManagement from '@/components/admin/PromotionsManagement';
import PromotionAnalytics from '@/components/admin/PromotionAnalytics';
import ProgramProductConfig from '@/components/admin/ProgramProductConfig';
import CustomerManagement from '@/components/admin/CustomerManagement';
import CustomerSegments from '@/components/admin/CustomerSegments';
import AbandonedCarts from '@/components/admin/AbandonedCarts';
import CollectionsManagement from '@/components/admin/CollectionsManagement';
import HomepageSettings from '@/components/admin/HomepageSettings';
import EnhancedDashboard from '@/components/admin/EnhancedDashboard';
import AdminUsersManagement from '@/components/admin/AdminUsersManagement';
import AdminAuditLog from '@/components/admin/AdminAuditLog';
import AdminSettings from '@/components/admin/AdminSettings';
import { Routes, Route } from 'react-router-dom';

const Admin = () => {
  const { isAdmin, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <AdminLayout />;
};

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Admin />}>
        <Route index element={<EnhancedDashboard />} />
        <Route path="collections" element={<CollectionsManagement />} />
        <Route path="homepage" element={<HomepageSettings />} />
        <Route path="subscriptions" element={<AdminSubscriptionManagement />} />
        <Route path="subscription-analytics" element={<SubscriptionAnalytics />} />
        <Route path="program-config" element={<ProgramProductConfig />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="promotions" element={<PromotionsManagement />} />
        <Route path="promotion-analytics" element={<PromotionAnalytics />} />
        <Route path="inventory" element={<InventoryManagement />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="segments" element={<CustomerSegments />} />
        <Route path="abandoned-carts" element={<AbandonedCarts />} />
        <Route path="users" element={<AdminUsersManagement />} />
        <Route path="audit-log" element={<AdminAuditLog />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
