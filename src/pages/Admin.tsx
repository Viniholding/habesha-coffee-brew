import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";

import EnhancedDashboard from "@/components/admin/EnhancedDashboard";
import CollectionsManagement from "@/components/admin/CollectionsManagement";
import HomepageSettings from "@/components/admin/HomepageSettings";

import { InventoryManagement } from "@/components/admin/InventoryManagement";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { OrderManagement } from "@/components/admin/OrderManagement";

import AdminSubscriptionManagement from "@/components/admin/SubscriptionManagement";
import SubscriptionAnalytics from "@/components/admin/SubscriptionAnalytics";

import PromotionsManagement from "@/components/admin/PromotionsManagement";
import PromotionAnalytics from "@/components/admin/PromotionAnalytics";

import ProgramProductConfig from "@/components/admin/ProgramProductConfig";

import CustomerManagement from "@/components/admin/CustomerManagement";
import CustomerSegments from "@/components/admin/CustomerSegments";
import AbandonedCarts from "@/components/admin/AbandonedCarts";

/**
 * Roles used for RBAC in admin.
 * Owner: full access
 * Manager: most modules except Settings/Admin Users
 * Support: limited modules (typically orders/tracking/notes + read-only elsewhere)
 */
type AdminRole = "owner" | "manager" | "support";

/**
 * A minimal, safe "role extraction" helper.
 * Adjust this to match how your useAdminAuth hook returns user info.
 */
function getRoleFromAuth(auth: any): AdminRole {
  // Common patterns:
  // auth.adminUser?.role
  // auth.user?.role
  // auth.role
  return (auth?.adminUser?.role || auth?.user?.role || auth?.role || "support") as AdminRole;
}

/**
 * Route guard for admin authentication + RBAC.
 * - If not logged in as admin => redirect to /admin/login (or /login if that's your app path)
 * - If logged in but role not allowed => redirect to /admin (dashboard)
 */
const AdminGuard: React.FC<{
  allow?: AdminRole[];
  children: React.ReactElement;
}> = ({ allow, children }) => {
  const auth = useAdminAuth();
  const { isAdmin, isLoading } = auth as any;
  const role = getRoleFromAuth(auth);

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

  // Not authenticated as admin
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  // Authenticated, but RBAC restriction
  if (allow && allow.length > 0 && !allow.includes(role)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

/**
 * Base Admin shell route element.
 * AdminLayout should render an <Outlet /> internally.
 * If it does not, update AdminLayout to include <Outlet />.
 */
const AdminShell = () => {
  return (
    <AdminGuard allow={["owner", "manager", "support"]}>
      <AdminLayout />
    </AdminGuard>
  );
};

/**
 * Placeholder components (safe defaults) so routing compiles even before you build these screens.
 * Replace these with real components when you implement the modules.
 */
const AdminUsersManagementPlaceholder = () => (
  <div className="p-6">
    <h1 className="text-xl font-semibold">Admin Users</h1>
    <p className="text-muted-foreground mt-2">
      Owner-only: Create admin accounts (Manager/Support), set roles, deactivate users, reset passwords.
    </p>
  </div>
);

const AdminSettingsPlaceholder = () => (
  <div className="p-6">
    <h1 className="text-xl font-semibold">Settings</h1>
    <p className="text-muted-foreground mt-2">
      Owner-only: Store settings, tax, shipping rules, email sender settings, and security preferences.
    </p>
  </div>
);

/**
 * Products route:
 * For now, alias "Products" to InventoryManagement since that appears to manage product inventory.
 * Later, split into:
 * - /admin/products (CRUD, images, SEO, status)
 * - /admin/inventory (stock controls)
 */
const ProductManagement = InventoryManagement;

/**
 * Support permissions:
 * - Typically Support can access Orders (and update tracking/status) + view certain data read-only.
 * If you want to strictly enforce Support-only capabilities inside pages, those components should
 * also check role and disable editing controls accordingly.
 */
const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminShell />}>
        {/* Dashboard */}
        <Route index element={<EnhancedDashboard />} />

        {/* Products & Merchandising */}
        <Route
          path="products"
          element={
            <AdminGuard allow={["owner", "manager"]}>
              <ProductManagement />
            </AdminGuard>
          }
        />
        <Route
          path="inventory"
          element={
            <AdminGuard allow={["owner", "manager"]}>
              <InventoryManagement />
            </AdminGuard>
          }
        />
        <Route
          path="collections"
          element={
            <AdminGuard allow={["owner", "manager"]}>
              <CollectionsManagement />
            </AdminGuard>
          }
        />
        <Route
          path="homepage"
          element={
            <AdminGuard allow={["owner", "manager"]}>
              <HomepageSettings />
            </AdminGuard>
          }
        />

        {/* Orders (Support allowed) */}
        <Route
          path="orders"
          element={
            <AdminGuard allow={["owner", "manager", "support"]}>
              <OrderManagement />
            </AdminGuard>
          }
        />

        {/* Subscriptions (Support usually read-only; restricting here to owner/manager) */}
        <Route
          path="subscriptions"
          element={
            <AdminGuard allow={["owner", "manager"]}>
              <AdminSubscriptionManagement />
            </AdminGuard>
          }
        />
        <Route
          path="subscription-analytics"
          element={
            <AdminGuard allow={["owner", "manager"]}>
              <SubscriptionAnalytics />
            </AdminGuard>
          }
        />

        {/* Promotions (Support not allowed) */}
        <Route
          path="promotions"
          element={
            <AdminGuard allow={["owner", "manager"]}>
              <PromotionsManagement />
            </AdminGuard>
          }
        />
        <Route
          path="promotion-analytics"
          element={
            <AdminGuard allow={["owner", "manager"]}>
              <PromotionAnalytics />
            </AdminGuard>
          }
        />

        {/* Program config (Owner/Manager) */}
        <Route
          path="program-config"
          element={
            <AdminGuard allow={["owner", "manager"]}>
              <ProgramProductConfig />
            </AdminGuard>
          }
        />

        {/* Customers & Growth */}
        <Route
          path="customers"
          element={
            <AdminGuard allow={["owner", "manager", "support"]}>
              <CustomerManagement />
            </AdminGuard>
          }
        />
        <Route
          path="segments"
          element={
            <AdminGuard allow={["owner", "manager"]}>
              <CustomerSegments />
            </AdminGuard>
          }
        />
        <Route
          path="carts"
          element={
            <AdminGuard allow={["owner", "manager"]}>
              <AbandonedCarts />
            </AdminGuard>
          }
        />
        <Route
          path="abandoned-carts"
          element={
            <AdminGuard allow={["owner", "manager"]}>
              <AbandonedCarts />
            </AdminGuard>
          }
        />

        {/* Analytics */}
        <Route
          path="analytics"
          element={
            <AdminGuard allow={["owner", "manager"]}>
              <AnalyticsDashboard />
            </AdminGuard>
          }
        />

        {/* Owner-only: Admin Users + Settings */}
        <Route
          path="users"
          element={
            <AdminGuard allow={["owner"]}>
              <AdminUsersManagementPlaceholder />
            </AdminGuard>
          }
        />
        <Route
          path="settings"
          element={
            <AdminGuard allow={["owner"]}>
              <AdminSettingsPlaceholder />
            </AdminGuard>
          }
        />

        {/* Catch-all inside admin */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { InventoryManagement } from "@/components/admin/InventoryManagement";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { OrderManagement } from "@/components/admin/OrderManagement";
import AdminSubscriptionManagement from "@/components/admin/SubscriptionManagement";
import SubscriptionAnalytics from "@/components/admin/SubscriptionAnalytics";
import PromotionsManagement from "@/components/admin/PromotionsManagement";
import PromotionAnalytics from "@/components/admin/PromotionAnalytics";
import ProgramProductConfig from "@/components/admin/ProgramProductConfig";
import CustomerManagement from "@/components/admin/CustomerManagement";
import CustomerSegments from "@/components/admin/CustomerSegments";
import AbandonedCarts from "@/components/admin/AbandonedCarts";
import CollectionsManagement from "@/components/admin/CollectionsManagement";
import HomepageSettings from "@/components/admin/HomepageSettings";
import EnhancedDashboard from "@/components/admin/EnhancedDashboard";
import { Routes, Route } from "react-router-dom";

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
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
