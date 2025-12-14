import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Video, ExternalLink, Loader2 } from 'lucide-react';
import { logAdminAction } from '@/lib/auditLog';

export default function LearnPageSettings() {
  const [videoUrl, setVideoUrl] = useState('');
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
        .eq('setting_key', 'learn_page_video_url')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        // Parse the JSON string value
        const url = typeof data.setting_value === 'string' 
          ? data.setting_value 
          : JSON.stringify(data.setting_value).replace(/"/g, '');
        setVideoUrl(url);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load video settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ 
          setting_value: JSON.stringify(videoUrl),
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'learn_page_video_url');

      if (error) throw error;

      await logAdminAction({
        actionType: 'settings_updated',
        entityType: 'site_settings',
        metadata: { setting_key: 'learn_page_video_url', new_value: videoUrl }
      });

      toast.success('Video settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save video settings');
    } finally {
      setSaving(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    // Convert YouTube watch URL to embed URL
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}?rel=0`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?rel=0`;
    }
    return url;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Video className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Learn Page Video</CardTitle>
            <CardDescription>
              Manage the coffee ceremony video displayed on the Learn page
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="video-url">Video Embed URL</Label>
          <div className="flex gap-2">
            <Input
              id="video-url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/embed/VIDEO_ID or YouTube watch URL"
              className="flex-1"
            />
            {videoUrl && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(videoUrl.replace('/embed/', '/watch?v='), '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Paste a YouTube embed URL or regular YouTube video URL. It will be automatically converted.
          </p>
        </div>

        {/* Preview */}
        {videoUrl && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted">
              <iframe
                className="w-full h-full"
                src={getEmbedUrl(videoUrl)}
                title="Video Preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
