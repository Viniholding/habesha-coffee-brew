import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole, AdminLevel } from '@/hooks/useAdminRole';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Shield, UserPlus, Edit, Key, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { logAdminAction } from '@/lib/auditLog';

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  admin_level: AdminLevel;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  profile?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export default function AdminUsersManagement() {
  const { isOwner, isLoading: roleLoading } = useAdminRole();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  // New admin form
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newRole, setNewRole] = useState<AdminLevel>('support');

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          admin_level,
          is_active,
          last_login_at,
          created_at
        `)
        .eq('role', 'admin');

      if (error) throw error;

      // Fetch profiles for each user
      const usersWithProfiles = await Promise.all(
        (roles || []).map(async (role) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('id', role.user_id)
            .single();
          
          return {
            ...role,
            profile,
          } as AdminUser;
        })
      );

      setAdminUsers(usersWithProfiles);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newEmail || !newPassword || !newRole) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Create user via edge function or directly
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: {
            first_name: newFirstName,
            last_name: newLastName,
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'admin',
          admin_level: newRole,
          is_active: true,
        });

      if (roleError) throw roleError;

      await logAdminAction({
        actionType: 'admin_user_created',
        entityType: 'user_roles',
        entityId: authData.user.id,
        newValues: { email: newEmail, admin_level: newRole },
      });

      toast.success('Admin user created successfully');
      setCreateDialogOpen(false);
      resetForm();
      fetchAdminUsers();
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast.error(error.message || 'Failed to create admin user');
    }
  };

  const handleUpdateRole = async (userId: string, newLevel: AdminLevel) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ admin_level: newLevel })
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) throw error;

      await logAdminAction({
        actionType: 'admin_role_updated',
        entityType: 'user_roles',
        entityId: userId,
        newValues: { admin_level: newLevel },
      });

      toast.success('Role updated successfully');
      fetchAdminUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    // Prevent deactivating the last owner
    const activeOwners = adminUsers.filter(u => u.admin_level === 'owner' && u.is_active);
    const targetUser = adminUsers.find(u => u.user_id === userId);
    
    if (!isActive && targetUser?.admin_level === 'owner' && activeOwners.length <= 1) {
      toast.error('Cannot deactivate the last owner account');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: isActive })
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) throw error;

      await logAdminAction({
        actionType: isActive ? 'admin_activated' : 'admin_deactivated',
        entityType: 'user_roles',
        entityId: userId,
      });

      toast.success(`Admin ${isActive ? 'activated' : 'deactivated'} successfully`);
      fetchAdminUsers();
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setNewEmail('');
    setNewPassword('');
    setNewFirstName('');
    setNewLastName('');
    setNewRole('support');
  };

  const getRoleBadgeVariant = (level: AdminLevel) => {
    switch (level) {
      case 'owner': return 'default';
      case 'manager': return 'secondary';
      case 'support': return 'outline';
      default: return 'outline';
    }
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
            Only owners can manage admin users.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Admin Users
          </h1>
          <p className="text-muted-foreground">Manage admin accounts and permissions</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Admin User</DialogTitle>
              <DialogDescription>
                Add a new admin user with specific role permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={newRole || ''} onValueChange={(v) => setNewRole(v as AdminLevel)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support">Support (Read-only)</SelectItem>
                    <SelectItem value="manager">Manager (Full operations)</SelectItem>
                    <SelectItem value="owner">Owner (Full access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateAdmin}>Create Admin</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <Badge variant="default">Owner</Badge>
              <p className="text-muted-foreground">Full system access including admin management and settings</p>
            </div>
            <div className="space-y-1">
              <Badge variant="secondary">Manager</Badge>
              <p className="text-muted-foreground">Products, orders, subscriptions, customers, analytics</p>
            </div>
            <div className="space-y-1">
              <Badge variant="outline">Support</Badge>
              <p className="text-muted-foreground">Read-only access, can update order status and add notes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Accounts</CardTitle>
          <CardDescription>
            {adminUsers.length} admin user{adminUsers.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminUsers.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {admin.profile?.first_name} {admin.profile?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{admin.profile?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={admin.admin_level || 'manager'}
                      onValueChange={(v) => handleUpdateRole(admin.user_id, v as AdminLevel)}
                    >
                      <SelectTrigger className="w-32">
                        <Badge variant={getRoleBadgeVariant(admin.admin_level)}>
                          {admin.admin_level || 'manager'}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={admin.is_active}
                        onCheckedChange={(checked) => handleToggleActive(admin.user_id, checked)}
                      />
                      <span className={admin.is_active ? 'text-green-600' : 'text-muted-foreground'}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {admin.last_login_at 
                      ? format(new Date(admin.last_login_at), 'MMM d, yyyy h:mm a')
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(admin.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Key className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
