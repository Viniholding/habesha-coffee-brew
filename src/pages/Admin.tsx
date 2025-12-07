import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { InventoryManagement } from '@/components/admin/InventoryManagement';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { OrderManagement } from '@/components/admin/OrderManagement';
import AdminSubscriptionManagement from '@/components/admin/SubscriptionManagement';
import SubscriptionAnalytics from '@/components/admin/SubscriptionAnalytics';
import PromotionsManagement from '@/components/admin/PromotionsManagement';
import PromotionAnalytics from '@/components/admin/PromotionAnalytics';
import { Routes, Route } from 'react-router-dom';

const AdminDashboardHome = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">Welcome to your admin dashboard</p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
};

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
        <Route index element={<AdminDashboardHome />} />
        <Route path="subscriptions" element={<AdminSubscriptionManagement />} />
        <Route path="subscription-analytics" element={<SubscriptionAnalytics />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="promotions" element={<PromotionsManagement />} />
        <Route path="promotion-analytics" element={<PromotionAnalytics />} />
        <Route path="inventory" element={<InventoryManagement />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
