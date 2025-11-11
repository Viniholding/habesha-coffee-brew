import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Mail, MessageSquare } from "lucide-react";

interface NotificationPreference {
  email_order_updates: boolean;
  email_promotional: boolean;
  email_newsletter: boolean;
  sms_order_updates: boolean;
  sms_promotional: boolean;
  sms_phone_number: string | null;
}

interface NotificationPreferencesProps {
  userId: string;
}

const NotificationPreferences = ({ userId }: NotificationPreferencesProps) => {
  const [preferences, setPreferences] = useState<NotificationPreference>({
    email_order_updates: true,
    email_promotional: false,
    email_newsletter: false,
    sms_order_updates: false,
    sms_promotional: false,
    sms_phone_number: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          email_order_updates: data.email_order_updates,
          email_promotional: data.email_promotional,
          email_newsletter: data.email_newsletter,
          sms_order_updates: data.sms_order_updates,
          sms_promotional: data.sms_promotional,
          sms_phone_number: data.sms_phone_number,
        });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
      toast.error("Failed to load notification preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: userId,
          ...preferences,
        });

      if (error) throw error;

      toast.success("Notification preferences saved successfully");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreference, value: boolean | string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card className="border-border/50 shadow-sm transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Email Notifications</CardTitle>
              <CardDescription>Manage your email notification preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between py-3 border-b border-border/50">
            <div className="space-y-0.5">
              <Label htmlFor="email_order_updates" className="text-base font-medium">
                Order Updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive emails about order confirmations, shipping updates, and delivery notifications
              </p>
            </div>
            <Switch
              id="email_order_updates"
              checked={preferences.email_order_updates}
              onCheckedChange={(checked) => updatePreference("email_order_updates", checked)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border/50">
            <div className="space-y-0.5">
              <Label htmlFor="email_promotional" className="text-base font-medium">
                Promotional Emails
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive special offers, discounts, and product recommendations
              </p>
            </div>
            <Switch
              id="email_promotional"
              checked={preferences.email_promotional}
              onCheckedChange={(checked) => updatePreference("email_promotional", checked)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="space-y-0.5">
              <Label htmlFor="email_newsletter" className="text-base font-medium">
                Newsletter
              </Label>
              <p className="text-sm text-muted-foreground">
                Stay updated with coffee tips, brewing guides, and company news
              </p>
            </div>
            <Switch
              id="email_newsletter"
              checked={preferences.email_newsletter}
              onCheckedChange={(checked) => updatePreference("email_newsletter", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card className="border-border/50 shadow-sm transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">SMS Notifications</CardTitle>
              <CardDescription>Manage your text message notification preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="sms_phone_number" className="text-base font-medium">
              Phone Number
            </Label>
            <Input
              id="sms_phone_number"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={preferences.sms_phone_number || ""}
              onChange={(e) => updatePreference("sms_phone_number", e.target.value)}
              className="border-border/50"
            />
            <p className="text-xs text-muted-foreground">
              Enter your phone number to receive SMS notifications
            </p>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border/50">
            <div className="space-y-0.5">
              <Label htmlFor="sms_order_updates" className="text-base font-medium">
                Order Updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Get text alerts for important order status changes
              </p>
            </div>
            <Switch
              id="sms_order_updates"
              checked={preferences.sms_order_updates}
              onCheckedChange={(checked) => updatePreference("sms_order_updates", checked)}
              disabled={!preferences.sms_phone_number}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="space-y-0.5">
              <Label htmlFor="sms_promotional" className="text-base font-medium">
                Promotional Messages
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive exclusive SMS-only deals and flash sales
              </p>
            </div>
            <Switch
              id="sms_promotional"
              checked={preferences.sms_promotional}
              onCheckedChange={(checked) => updatePreference("sms_promotional", checked)}
              disabled={!preferences.sms_phone_number}
            />
          </div>

          {!preferences.sms_phone_number && (
            <div className="bg-muted/30 border border-border/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Add your phone number to enable SMS notifications
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="min-w-[140px] transition-all duration-300 hover:shadow-lg"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
