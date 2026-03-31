import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Mail, Edit, Eye, Save, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { logAdminAction } from '@/lib/auditLog';

interface EmailTemplate {
  id: string;
  template_key: string;
  subject: string;
  html_template: string;
  description: string | null;
  is_active: boolean;
  updated_at: string;
}

interface EmailTemplatesSettingsProps {
  isOwner: boolean;
}

export default function EmailTemplatesSettings({ isOwner }: EmailTemplatesSettingsProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [editForm, setEditForm] = useState({
    subject: '',
    html_template: '',
    is_active: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_key');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditForm({
      subject: template.subject,
      html_template: template.html_template,
      is_active: template.is_active,
    });
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          subject: editForm.subject,
          html_template: editForm.html_template,
          is_active: editForm.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;

      await logAdminAction({
        actionType: 'settings_updated',
        entityType: 'email_template',
        entityId: editingTemplate.id,
        oldValues: {
          subject: editingTemplate.subject,
          is_active: editingTemplate.is_active,
        },
        newValues: {
          subject: editForm.subject,
          is_active: editForm.is_active,
        },
      });

      toast.success('Email template saved');
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (template: EmailTemplate) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;

      toast.success(`Template ${!template.is_active ? 'enabled' : 'disabled'}`);
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling template:', error);
      toast.error('Failed to update template');
    }
  };

  const getPreviewHtml = (template: EmailTemplate) => {
    // Replace placeholders with sample data
    return template.html_template
      .replace(/\{\{firstName\}\}/g, 'John')
      .replace(/\{\{productName\}\}/g, 'Ethiopian Yirgacheffe')
      .replace(/\{\{attemptCount\}\}/g, '2')
      .replace(/\{\{accountUrl\}\}/g, '#')
      .replace(/\{\{deliveryDate\}\}/g, 'December 20, 2025')
      .replace(/\{\{quantity\}\}/g, '2')
      .replace(/\{\{amount\}\}/g, '29.99');
  };

  const formatTemplateKey = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            Only owners can manage email templates.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Templates
          </h3>
          <p className="text-sm text-muted-foreground">
            Customize email notifications sent to customers
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{formatTemplateKey(template.template_key)}</h4>
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {template.description}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Subject:</span>{' '}
                    {template.subject}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Switch
                    checked={template.is_active}
                    onCheckedChange={() => toggleActive(template)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No email templates configured yet.
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {editingTemplate && formatTemplateKey(editingTemplate.template_key)}
            </DialogTitle>
            <DialogDescription>
              Customize the email subject and content. Use placeholders like {`{{firstName}}`}, {`{{productName}}`}, etc.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                placeholder="Email subject..."
              />
            </div>

            <div className="space-y-2">
              <Label>Email Body (HTML)</Label>
              <Textarea
                value={editForm.html_template}
                onChange={(e) => setEditForm({ ...editForm, html_template: e.target.value })}
                placeholder="Email HTML content..."
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
              />
              <Label>Template Active</Label>
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-2">Available Placeholders:</p>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <span>{`{{firstName}}`} - Customer name</span>
                <span>{`{{productName}}`} - Product name</span>
                <span>{`{{accountUrl}}`} - Account page link</span>
                <span>{`{{deliveryDate}}`} - Next delivery</span>
                <span>{`{{quantity}}`} - Order quantity</span>
                <span>{`{{amount}}`} - Order amount</span>
                <span>{`{{attemptCount}}`} - Failed attempt #</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Subject: {previewTemplate?.subject}
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-lg overflow-hidden">
            <iframe
              srcDoc={previewTemplate ? getPreviewHtml(previewTemplate) : ''}
              sandbox=""
              className="w-full min-h-[400px] bg-white"
              title="Email preview"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
