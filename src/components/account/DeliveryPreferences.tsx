import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface DeliveryPreference {
  leave_at_door: boolean;
  delivery_instructions: string;
  preferred_delivery_window: string;
}

interface DeliveryPreferencesProps {
  userId: string;
}

const DeliveryPreferences = ({ userId }: DeliveryPreferencesProps) => {
  const [preferences, setPreferences] = useState<DeliveryPreference>({
    leave_at_door: false,
    delivery_instructions: "",
    preferred_delivery_window: "anytime",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setPreferences({
          leave_at_door: data.leave_at_door,
          delivery_instructions: data.delivery_instructions || "",
          preferred_delivery_window: data.preferred_delivery_window || "anytime",
        });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
      toast.error("Failed to load delivery preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("delivery_preferences")
        .upsert({
          user_id: userId,
          ...preferences,
        });

      if (error) throw error;
      toast.success("Delivery preferences saved");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Preferences</CardTitle>
        <CardDescription>
          Set your default delivery preferences for all orders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Leave at Door</Label>
            <p className="text-sm text-muted-foreground">
              Allow delivery to be left at your door without signature
            </p>
          </div>
          <Switch
            checked={preferences.leave_at_door}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, leave_at_door: checked })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Preferred Delivery Window</Label>
          <Select
            value={preferences.preferred_delivery_window}
            onValueChange={(value) =>
              setPreferences({ ...preferences, preferred_delivery_window: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Morning (8AM - 12PM)</SelectItem>
              <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
              <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
              <SelectItem value="anytime">Anytime</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            We'll try to deliver during your preferred window when possible
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">Delivery Instructions</Label>
          <Textarea
            id="instructions"
            placeholder="E.g., Ring doorbell twice, Leave package by garage door, etc."
            value={preferences.delivery_instructions}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                delivery_instructions: e.target.value,
              })
            }
            rows={4}
          />
          <p className="text-sm text-muted-foreground">
            Special instructions for delivery drivers
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DeliveryPreferences;
