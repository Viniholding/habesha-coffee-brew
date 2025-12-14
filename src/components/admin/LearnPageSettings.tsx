import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Video, ExternalLink, Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import { logAdminAction } from '@/lib/auditLog';

interface VideoItem {
  id: string;
  title: string;
  url: string;
  description: string;
}

export default function LearnPageSettings() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
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
        .eq('setting_key', 'learn_page_videos')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        const parsed = typeof data.setting_value === 'string' 
          ? JSON.parse(data.setting_value) 
          : data.setting_value;
        if (Array.isArray(parsed)) {
          setVideos(parsed);
        }
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
          setting_value: JSON.parse(JSON.stringify(videos)),
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'learn_page_videos');

      if (error) throw error;

      await logAdminAction({
        actionType: 'settings_updated',
        entityType: 'site_settings',
        metadata: { setting_key: 'learn_page_videos', video_count: videos.length }
      });

      toast.success('Video settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save video settings');
    } finally {
      setSaving(false);
    }
  };

  const addVideo = () => {
    setVideos([
      ...videos,
      {
        id: crypto.randomUUID(),
        title: '',
        url: '',
        description: ''
      }
    ]);
  };

  const removeVideo = (id: string) => {
    setVideos(videos.filter(v => v.id !== id));
  };

  const updateVideo = (id: string, field: keyof VideoItem, value: string) => {
    setVideos(videos.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const getEmbedUrl = (url: string) => {
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Learn Page Videos</CardTitle>
              <CardDescription>
                Manage the coffee ceremony videos displayed on the Learn page carousel
              </CardDescription>
            </div>
          </div>
          <Button onClick={addVideo} variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Video
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {videos.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No videos added yet</p>
            <Button onClick={addVideo} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Add First Video
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video, index) => (
              <div 
                key={video.id}
                className="border border-border rounded-lg p-4 space-y-4 bg-card"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-2 text-muted-foreground cursor-grab">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={video.title}
                          onChange={(e) => updateVideo(video.id, 'title', e.target.value)}
                          placeholder="e.g., Traditional Coffee Ceremony"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Video URL</Label>
                        <div className="flex gap-2">
                          <Input
                            value={video.url}
                            onChange={(e) => updateVideo(video.id, 'url', e.target.value)}
                            placeholder="YouTube URL or embed URL"
                            className="flex-1"
                          />
                          {video.url && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => window.open(video.url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Input
                        value={video.description}
                        onChange={(e) => updateVideo(video.id, 'description', e.target.value)}
                        placeholder="Brief description of the video"
                      />
                    </div>
                    {video.url && (
                      <div className="aspect-video max-w-md rounded-lg overflow-hidden border border-border">
                        <iframe
                          className="w-full h-full"
                          src={getEmbedUrl(video.url)}
                          title={video.title || 'Video Preview'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVideo(video.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-border">
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
