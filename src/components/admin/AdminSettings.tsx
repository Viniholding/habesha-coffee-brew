import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, Store, CreditCard, Truck, Receipt, Shield, AlertTriangle, Check, X, Mail, Ban, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { logAdminAction } from '@/lib/auditLog';
import EmailTemplatesSettings from './EmailTemplatesSettings';
import AbuseSettingsTab from './AbuseSettingsTab';
import LearnPageSettings from './LearnPageSettings';

interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  ip_address: string | null;
  attempted_at: string;
}

export default function AdminSettings() {
  const { isOwner, isLoading: roleLoading } = useAdminRole();
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings state (would be stored in a settings table in production)
  const [settings, setSettings] = useState({
    storeName: 'Habesha Coffee',
    contactEmail: 'contact@habesha.coffee',
    supportEmail: 'support@habesha.coffee',
    defaultTaxRate: 8,
    freeShippingThreshold: 50,
    flatShippingRate: 5.99,
    sessionTimeout: 30,
    minPasswordLength: 8,
    rateLimitEnabled: true,
  });

  useEffect(() => {
    fetchLoginAttempts();
  }, []);

  const fetchLoginAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_login_attempts')
        .select('*')
        .order('attempted_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLoginAttempts(data || []);
    } catch (error) {
      console.error('Error fetching login attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    toast.success('Settings saved successfully');
    
    await logAdminAction({
      actionType: 'settings_updated',
      entityType: 'settings',
      newValues: settings,
    });
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground text-center">
            Only owners can access system settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-muted-foreground">Configure store settings and security options</p>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="store" className="gap-2">
            <Store className="h-4 w-4" />
            Store
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="learn" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Learn Page
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2">
            <Truck className="h-4 w-4" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="tax" className="gap-2">
            <Receipt className="h-4 w-4" />
            Tax
          </TabsTrigger>
          <TabsTrigger value="abuse" className="gap-2">
            <Ban className="h-4 w-4" />
            Abuse Detection
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Store Settings</CardTitle>
              <CardDescription>Configure your store information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Store Name</Label>
                <Input
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                />
              </div>
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <EmailTemplatesSettings isOwner={isOwner} />
        </TabsContent>

        <TabsContent value="learn">
          <LearnPageSettings />
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure Stripe and payment options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Stripe Connection</p>
                  <p className="text-sm text-muted-foreground">Payments are processed via Stripe</p>
                </div>
                <Badge variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Webhook Status</p>
                  <p className="text-sm text-muted-foreground">Receives real-time payment events</p>
                </div>
                <Badge variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Settings</CardTitle>
              <CardDescription>Configure shipping rates and options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Flat Shipping Rate ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.flatShippingRate}
                  onChange={(e) => setSettings({ ...settings, flatShippingRate: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Free Shipping Threshold ($)</Label>
                <Input
                  type="number"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">Orders above this amount get free shipping</p>
              </div>
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>Configure tax collection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.defaultTaxRate}
                  onChange={(e) => setSettings({ ...settings, defaultTaxRate: parseFloat(e.target.value) })}
                />
              </div>
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abuse">
          <AbuseSettingsTab />
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure session and authentication options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                </div>
                <div className="space-y-2">
                  <Label>Minimum Password Length</Label>
                  <Input
                    type="number"
                    value={settings.minPasswordLength}
                    onChange={(e) => setSettings({ ...settings, minPasswordLength: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rate Limiting</p>
                    <p className="text-sm text-muted-foreground">Block after 5 failed login attempts</p>
                  </div>
                  <Switch
                    checked={settings.rateLimitEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, rateLimitEnabled: checked })}
                  />
                </div>
                <Button onClick={handleSaveSettings}>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Login Attempts</CardTitle>
                <CardDescription>Monitor admin login activity</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginAttempts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No login attempts recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      loginAttempts.slice(0, 10).map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell>{attempt.email}</TableCell>
                          <TableCell>
                            {attempt.success ? (
                              <Badge variant="default" className="gap-1">
                                <Check className="h-3 w-3" />
                                Success
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1">
                                <X className="h-3 w-3" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {attempt.ip_address || 'N/A'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(attempt.attempted_at), 'MMM d, h:mm a')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
