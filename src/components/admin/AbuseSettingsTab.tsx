import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Shield, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { logAdminAction } from '@/lib/auditLog';

interface AbuseSettings {
  autoRestrictThreshold: number;
  highRiskThreshold: number;
  mediumRiskThreshold: number;
  lowRiskThreshold: number;
  cooldownDays: number;
  dailyScoreDecay: number;
  liftRestrictionThreshold: number;
  earlyCancellationScore: number;
  discountReversalScore: number;
  couponRejectionScore: number;
  pauseCycleScore: number;
}

const DEFAULT_SETTINGS: AbuseSettings = {
  autoRestrictThreshold: 100,
  highRiskThreshold: 75,
  mediumRiskThreshold: 50,
  lowRiskThreshold: 25,
  cooldownDays: 30,
  dailyScoreDecay: 2,
  liftRestrictionThreshold: 50,
  earlyCancellationScore: 25,
  discountReversalScore: 30,
  couponRejectionScore: 5,
  pauseCycleScore: 10,
};

export default function AbuseSettingsTab() {
  const [settings, setSettings] = useState<AbuseSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'abuse_detection_config')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.setting_value && typeof data.setting_value === 'object') {
        const parsed = data.setting_value as Record<string, unknown>;
        setSettings({ 
          ...DEFAULT_SETTINGS, 
          autoRestrictThreshold: (parsed.autoRestrictThreshold as number) ?? DEFAULT_SETTINGS.autoRestrictThreshold,
          highRiskThreshold: (parsed.highRiskThreshold as number) ?? DEFAULT_SETTINGS.highRiskThreshold,
          mediumRiskThreshold: (parsed.mediumRiskThreshold as number) ?? DEFAULT_SETTINGS.mediumRiskThreshold,
          lowRiskThreshold: (parsed.lowRiskThreshold as number) ?? DEFAULT_SETTINGS.lowRiskThreshold,
          cooldownDays: (parsed.cooldownDays as number) ?? DEFAULT_SETTINGS.cooldownDays,
          dailyScoreDecay: (parsed.dailyScoreDecay as number) ?? DEFAULT_SETTINGS.dailyScoreDecay,
          liftRestrictionThreshold: (parsed.liftRestrictionThreshold as number) ?? DEFAULT_SETTINGS.liftRestrictionThreshold,
          earlyCancellationScore: (parsed.earlyCancellationScore as number) ?? DEFAULT_SETTINGS.earlyCancellationScore,
          discountReversalScore: (parsed.discountReversalScore as number) ?? DEFAULT_SETTINGS.discountReversalScore,
          couponRejectionScore: (parsed.couponRejectionScore as number) ?? DEFAULT_SETTINGS.couponRejectionScore,
          pauseCycleScore: (parsed.pauseCycleScore as number) ?? DEFAULT_SETTINGS.pauseCycleScore,
        });
      }
    } catch (error) {
      console.error('Error fetching abuse settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', 'abuse_detection_config')
        .maybeSingle();

      const settingsJson = JSON.parse(JSON.stringify(settings));

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ 
            setting_value: settingsJson,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'abuse_detection_config');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({
            setting_key: 'abuse_detection_config',
            setting_value: settingsJson,
            description: 'Configuration for abuse detection thresholds and scoring',
          });
        if (error) throw error;
      }

      await logAdminAction({
        actionType: 'settings_updated',
        entityType: 'settings',
        newValues: settings,
      });

      toast.success('Abuse detection settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    toast.info('Settings reset to defaults (not saved)');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Abuse Detection Thresholds
          </CardTitle>
          <CardDescription>
            Configure risk score thresholds for flagging and auto-restricting accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Auto-Restrict Threshold: {settings.autoRestrictThreshold}</Label>
              <Slider
                value={[settings.autoRestrictThreshold]}
                onValueChange={([v]) => setSettings({ ...settings, autoRestrictThreshold: v })}
                min={50}
                max={200}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Accounts are auto-restricted when score reaches this value
              </p>
            </div>

            <div className="space-y-3">
              <Label>High Risk Threshold: {settings.highRiskThreshold}</Label>
              <Slider
                value={[settings.highRiskThreshold]}
                onValueChange={([v]) => setSettings({ ...settings, highRiskThreshold: v })}
                min={25}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <Label>Medium Risk Threshold: {settings.mediumRiskThreshold}</Label>
              <Slider
                value={[settings.mediumRiskThreshold]}
                onValueChange={([v]) => setSettings({ ...settings, mediumRiskThreshold: v })}
                min={10}
                max={75}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <Label>Low Risk Threshold: {settings.lowRiskThreshold}</Label>
              <Slider
                value={[settings.lowRiskThreshold]}
                onValueChange={([v]) => setSettings({ ...settings, lowRiskThreshold: v })}
                min={5}
                max={50}
                step={5}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Score Point Values</CardTitle>
          <CardDescription>
            Configure how many points each type of abuse event adds to the score
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Early Cancellation Score</Label>
              <Input
                type="number"
                value={settings.earlyCancellationScore}
                onChange={(e) => setSettings({ ...settings, earlyCancellationScore: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Points added per early subscription cancellation</p>
            </div>

            <div className="space-y-2">
              <Label>Discount Reversal Score</Label>
              <Input
                type="number"
                value={settings.discountReversalScore}
                onChange={(e) => setSettings({ ...settings, discountReversalScore: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Points added per discount reversal charge</p>
            </div>

            <div className="space-y-2">
              <Label>Coupon Rejection Score</Label>
              <Input
                type="number"
                value={settings.couponRejectionScore}
                onChange={(e) => setSettings({ ...settings, couponRejectionScore: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Points added per coupon rejection</p>
            </div>

            <div className="space-y-2">
              <Label>Pause Cycle Score</Label>
              <Input
                type="number"
                value={settings.pauseCycleScore}
                onChange={(e) => setSettings({ ...settings, pauseCycleScore: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Points added per early pause cycle</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cooldown & Recovery</CardTitle>
          <CardDescription>
            Configure how restrictions are automatically lifted over time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Cooldown Days</Label>
              <Input
                type="number"
                value={settings.cooldownDays}
                onChange={(e) => setSettings({ ...settings, cooldownDays: parseInt(e.target.value) || 30 })}
              />
              <p className="text-xs text-muted-foreground">Days before auto-lift is considered</p>
            </div>

            <div className="space-y-2">
              <Label>Daily Score Decay</Label>
              <Input
                type="number"
                value={settings.dailyScoreDecay}
                onChange={(e) => setSettings({ ...settings, dailyScoreDecay: parseInt(e.target.value) || 2 })}
              />
              <p className="text-xs text-muted-foreground">Points reduced per day of good behavior</p>
            </div>

            <div className="space-y-2">
              <Label>Lift Restriction Threshold</Label>
              <Input
                type="number"
                value={settings.liftRestrictionThreshold}
                onChange={(e) => setSettings({ ...settings, liftRestrictionThreshold: parseInt(e.target.value) || 50 })}
              />
              <p className="text-xs text-muted-foreground">Score must drop below this to auto-lift</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
      </div>

      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-orange-800 dark:text-orange-200">Important</p>
              <p className="text-orange-700 dark:text-orange-300">
                Changes to these settings apply to new abuse events only. Existing abuse scores 
                are not recalculated. The daily scheduled job uses these settings for score decay 
                and auto-lift decisions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
