import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Users, DollarSign, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Segment {
  id: string;
  name: string;
  description: string | null;
  rules: any[];
  is_active: boolean;
  created_at: string;
  member_count?: number;
  total_ltv?: number;
}

interface SegmentRule {
  field: string;
  operator: string;
  value: string;
}

const FIELD_OPTIONS = [
  { value: 'ltv', label: 'Lifetime Value' },
  { value: 'order_count', label: 'Number of Orders' },
  { value: 'has_subscription', label: 'Has Active Subscription' },
  { value: 'last_order_days', label: 'Days Since Last Order' },
  { value: 'created_days', label: 'Days Since Signup' },
];

const OPERATOR_OPTIONS = [
  { value: 'gt', label: 'Greater than' },
  { value: 'lt', label: 'Less than' },
  { value: 'eq', label: 'Equals' },
  { value: 'gte', label: 'Greater or equal' },
  { value: 'lte', label: 'Less or equal' },
];

const CustomerSegments = () => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: '',
    description: '',
    rules: [{ field: 'ltv', operator: 'gt', value: '' }] as SegmentRule[],
  });

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_segments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate member counts for each segment
      const segmentsWithStats = await Promise.all(
        (data || []).map(async (segment) => {
          const rulesArray = Array.isArray(segment.rules) ? (segment.rules as unknown as SegmentRule[]) : [];
          const memberCount = await calculateSegmentMembers(rulesArray);
          return {
            ...segment,
            rules: rulesArray,
            member_count: memberCount.count,
            total_ltv: memberCount.ltv,
          };
        })
      );

      setSegments(segmentsWithStats);
    } catch (error) {
      console.error('Error fetching segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSegmentMembers = async (rules: SegmentRule[]) => {
    try {
      // Fetch all profiles with their order data
      const { data: profiles } = await supabase.from('profiles').select('id');
      const { data: orders } = await supabase.from('orders').select('user_id, total, created_at');
      const { data: subscriptions } = await supabase.from('subscriptions').select('user_id, status');

      let matchingUsers: string[] = [];
      let totalLtv = 0;

      (profiles || []).forEach(profile => {
        const userOrders = orders?.filter(o => o.user_id === profile.id) || [];
        const userLtv = userOrders.reduce((sum, o) => sum + parseFloat(String(o.total)), 0);
        const hasActiveSub = subscriptions?.some(s => s.user_id === profile.id && s.status === 'active');
        const lastOrderDate = userOrders.length > 0
          ? Math.max(...userOrders.map(o => new Date(o.created_at).getTime()))
          : null;
        const daysSinceLastOrder = lastOrderDate
          ? Math.floor((Date.now() - lastOrderDate) / (1000 * 60 * 60 * 24))
          : Infinity;

        let matches = true;
        for (const rule of rules) {
          let fieldValue: number;
          switch (rule.field) {
            case 'ltv':
              fieldValue = userLtv;
              break;
            case 'order_count':
              fieldValue = userOrders.length;
              break;
            case 'has_subscription':
              fieldValue = hasActiveSub ? 1 : 0;
              break;
            case 'last_order_days':
              fieldValue = daysSinceLastOrder;
              break;
            default:
              fieldValue = 0;
          }

          const ruleValue = parseFloat(rule.value) || 0;
          switch (rule.operator) {
            case 'gt':
              if (!(fieldValue > ruleValue)) matches = false;
              break;
            case 'lt':
              if (!(fieldValue < ruleValue)) matches = false;
              break;
            case 'eq':
              if (!(fieldValue === ruleValue)) matches = false;
              break;
            case 'gte':
              if (!(fieldValue >= ruleValue)) matches = false;
              break;
            case 'lte':
              if (!(fieldValue <= ruleValue)) matches = false;
              break;
          }
        }

        if (matches) {
          matchingUsers.push(profile.id);
          totalLtv += userLtv;
        }
      });

      return { count: matchingUsers.length, ltv: totalLtv };
    } catch (error) {
      console.error('Error calculating segment members:', error);
      return { count: 0, ltv: 0 };
    }
  };

  const handleCreateSegment = async () => {
    if (!newSegment.name) {
      toast.error('Please enter a segment name');
      return;
    }

    try {
      const { error } = await supabase.from('customer_segments').insert([{
        name: newSegment.name,
        description: newSegment.description || null,
        rules: newSegment.rules as any,
      }]);

      if (error) throw error;

      toast.success('Segment created successfully');
      setCreateOpen(false);
      setNewSegment({
        name: '',
        description: '',
        rules: [{ field: 'ltv', operator: 'gt', value: '' }],
      });
      fetchSegments();
    } catch (error) {
      console.error('Error creating segment:', error);
      toast.error('Failed to create segment');
    }
  };

  const handleDeleteSegment = async (segmentId: string) => {
    try {
      const { error } = await supabase
        .from('customer_segments')
        .delete()
        .eq('id', segmentId);

      if (error) throw error;
      toast.success('Segment deleted');
      fetchSegments();
    } catch (error) {
      console.error('Error deleting segment:', error);
      toast.error('Failed to delete segment');
    }
  };

  const addRule = () => {
    setNewSegment(prev => ({
      ...prev,
      rules: [...prev.rules, { field: 'ltv', operator: 'gt', value: '' }],
    }));
  };

  const updateRule = (index: number, field: keyof SegmentRule, value: string) => {
    setNewSegment(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) =>
        i === index ? { ...rule, [field]: value } : rule
      ),
    }));
  };

  const removeRule = (index: number) => {
    setNewSegment(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Segments</h1>
          <p className="text-muted-foreground mt-2">Create dynamic customer segments for targeting</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Segment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Customer Segment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Segment Name</Label>
                <Input
                  value={newSegment.name}
                  onChange={(e) => setNewSegment(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., High Value Customers"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newSegment.description}
                  onChange={(e) => setNewSegment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this segment..."
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Rules</Label>
                  <Button variant="outline" size="sm" onClick={addRule}>
                    <Plus className="h-4 w-4 mr-1" /> Add Rule
                  </Button>
                </div>
                <div className="space-y-2">
                  {newSegment.rules.map((rule, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <Select
                        value={rule.field}
                        onValueChange={(v) => updateRule(index, 'field', v)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={rule.operator}
                        onValueChange={(v) => updateRule(index, 'operator', v)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATOR_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={rule.value}
                        onChange={(e) => updateRule(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="w-[100px]"
                      />
                      {newSegment.rules.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRule(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateSegment} className="w-full">
                Create Segment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Segments Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {segments.map((segment) => (
          <Card key={segment.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{segment.name}</CardTitle>
                  {segment.description && (
                    <CardDescription className="mt-1">{segment.description}</CardDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteSegment(segment.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">{segment.member_count || 0}</div>
                    <div className="text-xs text-muted-foreground">Customers</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">${(segment.total_ltv || 0).toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">Total LTV</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1">
                {(segment.rules as SegmentRule[]).map((rule, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    {FIELD_OPTIONS.find(f => f.value === rule.field)?.label} {rule.operator} {rule.value}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Created {format(new Date(segment.created_at), 'MMM d, yyyy')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {segments.length === 0 && (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No segments yet</h3>
          <p className="text-muted-foreground mb-4">Create your first customer segment to start targeting</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Segment
          </Button>
        </Card>
      )}
    </div>
  );
};

export default CustomerSegments;
