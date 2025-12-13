import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Eye, Image } from 'lucide-react';

interface HomepageSettings {
  id: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  hero_button_text: string | null;
  hero_button_link: string | null;
  featured_collection_id: string | null;
}

interface Collection {
  id: string;
  name: string;
}

const HomepageSettingsComponent = () => {
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_image_url: '',
    hero_button_text: '',
    hero_button_link: '',
    featured_collection_id: '',
  });

  useEffect(() => {
    fetchSettings();
    fetchCollections();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data);
        setFormData({
          hero_title: data.hero_title || '',
          hero_subtitle: data.hero_subtitle || '',
          hero_image_url: data.hero_image_url || '',
          hero_button_text: data.hero_button_text || '',
          hero_button_link: data.hero_button_link || '',
          featured_collection_id: data.featured_collection_id || '',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        hero_title: formData.hero_title || null,
        hero_subtitle: formData.hero_subtitle || null,
        hero_image_url: formData.hero_image_url || null,
        hero_button_text: formData.hero_button_text || null,
        hero_button_link: formData.hero_button_link || null,
        featured_collection_id: formData.featured_collection_id || null,
        updated_at: new Date().toISOString(),
      };

      if (settings) {
        const { error } = await supabase
          .from('homepage_settings')
          .update(updateData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('homepage_settings')
          .insert(updateData);

        if (error) throw error;
      }

      toast.success('Settings saved');
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Homepage Settings</h1>
          <p className="text-muted-foreground mt-1">Customize your storefront hero and featured content</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('/', '_blank')}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
            <CardDescription>The main banner that appears at the top of your homepage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.hero_title}
                onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                placeholder="Experience the Birthplace of Coffee"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={formData.hero_subtitle}
                onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                placeholder="Premium single-origin Ethiopian coffee..."
              />
            </div>
            <div className="space-y-2">
              <Label>Background Image URL</Label>
              <Input
                value={formData.hero_image_url}
                onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                placeholder="https://..."
              />
              {formData.hero_image_url && (
                <img
                  src={formData.hero_image_url}
                  alt="Hero preview"
                  className="w-full h-32 object-cover rounded-md"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={formData.hero_button_text}
                  onChange={(e) => setFormData({ ...formData, hero_button_text: e.target.value })}
                  placeholder="Shop Now"
                />
              </div>
              <div className="space-y-2">
                <Label>Button Link</Label>
                <Input
                  value={formData.hero_button_link}
                  onChange={(e) => setFormData({ ...formData, hero_button_link: e.target.value })}
                  placeholder="/products"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Featured Content</CardTitle>
            <CardDescription>Choose which collection to feature on the homepage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Featured Collection</Label>
              <Select
                value={formData.featured_collection_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, featured_collection_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                This collection will be prominently displayed on the homepage
              </p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Quick Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Use high-quality images (1920x1080 recommended)</li>
                <li>• Keep titles short and impactful</li>
                <li>• Rotate featured collections seasonally</li>
                <li>• Test on mobile to ensure readability</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="relative rounded-lg overflow-hidden bg-muted"
            style={{
              backgroundImage: formData.hero_image_url ? `url(${formData.hero_image_url})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '300px',
            }}
          >
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 p-8 flex flex-col items-center justify-center min-h-[300px] text-center text-white">
              <h2 className="text-3xl font-bold mb-2">
                {formData.hero_title || 'Your Hero Title'}
              </h2>
              <p className="text-lg opacity-90 mb-6 max-w-2xl">
                {formData.hero_subtitle || 'Your subtitle text goes here'}
              </p>
              <Button size="lg">
                {formData.hero_button_text || 'Button Text'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomepageSettingsComponent;
