import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  BarChart3, 
  Menu, 
  X,
  LogOut,
  Home,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Tag,
  Settings,
  Users,
  Layers,
  Palette,
  Shield,
  FileText,
  Plus,
  AlertTriangle,
  Truck,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import logo from '@/assets/logo.png';

const getNavigation = (adminLevel: 'owner' | 'manager' | 'support' | null) => {
  // Support role: minimal read-only access
  if (adminLevel === 'support') {
    return [
      { name: 'Dashboard', href: '/commandcenter', icon: LayoutDashboard },
      { name: 'Customers', href: '/commandcenter/customers', icon: Users },
      { name: 'Orders', href: '/commandcenter/orders', icon: Package },
    ];
  }
  
  // Manager and Owner get full operational access
  const nav = [
    { name: 'Dashboard', href: '/commandcenter', icon: LayoutDashboard },
    { name: 'Collections', href: '/commandcenter/collections', icon: Layers },
    { name: 'Homepage', href: '/commandcenter/homepage', icon: Palette },
    { name: 'Customers', href: '/commandcenter/customers', icon: Users },
    { name: 'Segments', href: '/commandcenter/segments', icon: TrendingUp },
    { name: 'Abandoned Carts', href: '/commandcenter/abandoned-carts', icon: ShoppingCart },
    { name: 'Subscriptions', href: '/commandcenter/subscriptions', icon: RefreshCw },
    { name: 'Program Config', href: '/commandcenter/program-config', icon: Settings },
    { name: 'Orders', href: '/commandcenter/orders', icon: Package },
    { name: 'Promotions', href: '/commandcenter/promotions', icon: Tag },
    { name: 'Promotion Analytics', href: '/commandcenter/promotion-analytics', icon: BarChart3 },
    { name: 'Inventory', href: '/commandcenter/inventory', icon: Plus },
    { name: 'Suppliers', href: '/commandcenter/suppliers', icon: Truck },
    { name: 'Product Order', href: '/commandcenter/product-ordering', icon: ArrowUpDown },
    { name: 'Audit Log', href: '/commandcenter/audit-log', icon: FileText },
    { name: 'Abuse Detection', href: '/commandcenter/abuse-detection', icon: AlertTriangle },
  ];
  
  // Owner-only pages
  if (adminLevel === 'owner') {
    nav.push({ name: 'Admin Users', href: '/commandcenter/users', icon: Shield });
    nav.push({ name: 'Settings', href: '/commandcenter/settings', icon: Settings });
  }
  
  return nav;
};

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { adminLevel, isOwner } = useAdminRole();
  
  // Enable session timeout for admin
  useSessionTimeout(true);
  
  const navigation = getNavigation(adminLevel);
  
  // Route protection - block unauthorized access
  const ownerOnlyRoutes = ['/commandcenter/users', '/commandcenter/settings'];
  const managerRoutes = ['/commandcenter/collections', '/commandcenter/homepage', '/commandcenter/segments', '/commandcenter/abandoned-carts', '/commandcenter/subscriptions', '/commandcenter/program-config', '/commandcenter/promotions', '/commandcenter/promotion-analytics', '/commandcenter/inventory', '/commandcenter/suppliers', '/commandcenter/product-ordering', '/commandcenter/audit-log', '/commandcenter/abuse-detection'];
  
  const currentPath = location.pathname;
  
  // Block support from manager routes
  if (adminLevel === 'support' && managerRoutes.some(route => currentPath.startsWith(route))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate('/commandcenter')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }
  
  // Block non-owners from owner-only routes
  if (!isOwner && ownerOnlyRoutes.some(route => currentPath.startsWith(route))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Owner Access Required</h2>
          <p className="text-muted-foreground mb-4">Only owners can access this section.</p>
          <Button onClick={() => navigate('/commandcenter')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-background/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-card border-r flex flex-col">
          <div className="flex h-16 items-center justify-between px-4 border-b shrink-0">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Habesha" className="h-10 w-10 rounded-full" />
              <h1 className="text-sm font-bold leading-tight">Habesha<br/>Command</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-4 shrink-0">
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Back to Store</span>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-4 py-3 mt-2"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 border-r bg-card">
          <div className="flex h-16 items-center px-4 border-b shrink-0 gap-3">
            <img src={logo} alt="Habesha" className="h-10 w-10 rounded-full" />
            <h1 className="text-lg font-bold leading-tight">Habesha<br/>Command Center</h1>
          </div>
          <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-4 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Back to Store</span>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-4 py-3 mt-2"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
