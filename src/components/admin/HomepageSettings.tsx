import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Save, Eye, Monitor, Tablet, Smartphone, AlignLeft, AlignCenter, AlignRight,
  Sun, Moon, TrendingUp, TrendingDown, Clock, Undo2, History, AlertTriangle,
  Sparkles, Calendar, ChevronUp, ChevronDown, GripVertical, Grid, LayoutGrid
} from 'lucide-react';
import { format } from 'date-fns';
import { logAdminAction } from '@/lib/auditLog';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface FormData {
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  hero_button_text: string;
  hero_button_link: string;
  featured_collection_id: string;
  // New interactive fields
  hero_enabled: boolean;
  hero_start_date: string;
  hero_end_date: string;
  text_alignment: 'left' | 'center' | 'right';
  overlay_type: 'dark' | 'light';
  overlay_opacity: number;
  secondary_button_text: string;
  secondary_button_link: string;
  animation: 'none' | 'fade-in' | 'slide-up';
  featured_enabled: boolean;
  featured_collections: string[];
  featured_layout: 'grid' | 'carousel';
  product_limit: number;
}

interface VersionHistory {
  id: string;
  timestamp: Date;
  formData: FormData;
}

type DevicePreview = 'desktop' | 'tablet' | 'mobile';

const SortableCollection = ({ id, name, onRemove }: { id: string; name: string; onRemove: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-muted rounded-lg"
    >
      <button {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className="flex-1 text-sm">{name}</span>
      <Button variant="ghost" size="sm" onClick={onRemove} className="h-6 w-6 p-0">
        ×
      </Button>
    </div>
  );
};

const HomepageSettingsComponent = () => {
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('desktop');
  const [isDraft, setIsDraft] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([]);
  const [lastSavedData, setLastSavedData] = useState<FormData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d'>('7d');
  
  const [formData, setFormData] = useState<FormData>({
    hero_title: '',
    hero_subtitle: '',
    hero_image_url: '',
    hero_button_text: '',
    hero_button_link: '',
    featured_collection_id: '',
    hero_enabled: true,
    hero_start_date: '',
    hero_end_date: '',
    text_alignment: 'center',
    overlay_type: 'dark',
    overlay_opacity: 50,
    secondary_button_text: '',
    secondary_button_link: '',
    animation: 'fade-in',
    featured_enabled: true,
    featured_collections: [],
    featured_layout: 'grid',
    product_limit: 6,
  });

  // Performance metrics (mock data for now)
  const [metrics] = useState({
    heroClickRate: 12.5,
    heroClickChange: 2.3,
    collectionClicks: 234,
    collectionClickChange: -1.2,
  });

  // Warnings
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    fetchSettings();
    fetchCollections();
  }, []);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  // Check for warnings
  useEffect(() => {
    const newWarnings: string[] = [];
    
    if (formData.hero_title.length > 50) {
      newWarnings.push('Hero title may overflow on mobile devices (>50 characters)');
    }
    
    if (formData.overlay_type === 'light' && formData.overlay_opacity < 30) {
      newWarnings.push('Text contrast may be insufficient with light overlay at low opacity');
    }
    
    setWarnings(newWarnings);
  }, [formData]);

  // Track unsaved changes
  useEffect(() => {
    if (lastSavedData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(lastSavedData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, lastSavedData]);

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
        const newFormData = {
          ...formData,
          hero_title: data.hero_title || '',
          hero_subtitle: data.hero_subtitle || '',
          hero_image_url: data.hero_image_url || '',
          hero_button_text: data.hero_button_text || '',
          hero_button_link: data.hero_button_link || '',
          featured_collection_id: data.featured_collection_id || '',
          featured_collections: data.featured_collection_id ? [data.featured_collection_id] : [],
        };
        setFormData(newFormData);
        setLastSavedData(newFormData);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
      setTimeout(() => setPreviewLoading(false), 500);
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
        featured_collection_id: formData.featured_collections[0] || null,
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

      // Add to version history
      setVersionHistory(prev => [
        { id: crypto.randomUUID(), timestamp: new Date(), formData: { ...formData } },
        ...prev.slice(0, 9) // Keep last 10 versions
      ]);

      setLastSavedData({ ...formData });
      setHasUnsavedChanges(false);
      setIsDraft(false);
      
      await logAdminAction({ actionType: 'settings_updated', entityType: 'homepage_settings', entityId: settings?.id });
      
      toast.success('Settings saved', {
        action: {
          label: 'Undo',
          onClick: () => handleUndo(),
        },
      });
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = () => {
    if (versionHistory.length > 1) {
      const previousVersion = versionHistory[1];
      setFormData(previousVersion.formData);
      toast.success('Reverted to previous version');
    }
  };

  const restoreVersion = (version: VersionHistory) => {
    setFormData(version.formData);
    setHasUnsavedChanges(true);
    toast.success('Version restored - remember to save');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = prev.featured_collections.indexOf(active.id as string);
        const newIndex = prev.featured_collections.indexOf(over.id as string);
        return {
          ...prev,
          featured_collections: arrayMove(prev.featured_collections, oldIndex, newIndex),
        };
      });
    }
  };

  const addCollection = (collectionId: string) => {
    if (!formData.featured_collections.includes(collectionId)) {
      setFormData(prev => ({
        ...prev,
        featured_collections: [...prev.featured_collections, collectionId],
      }));
    }
  };

  const removeCollection = (collectionId: string) => {
    setFormData(prev => ({
      ...prev,
      featured_collections: prev.featured_collections.filter(id => id !== collectionId),
    }));
  };

  const getPreviewWidth = () => {
    switch (devicePreview) {
      case 'mobile': return 'max-w-[375px]';
      case 'tablet': return 'max-w-[768px]';
      default: return 'max-w-full';
    }
  };

  const getAnimationClass = () => {
    switch (formData.animation) {
      case 'fade-in': return 'animate-fade-in';
      case 'slide-up': return 'animate-fade-in';
      default: return '';
    }
  };

  const getAlignmentClass = () => {
    switch (formData.text_alignment) {
      case 'left': return 'items-start text-left';
      case 'right': return 'items-end text-right';
      default: return 'items-center text-center';
    }
  };

  const isScheduled = () => {
    const now = new Date();
    if (formData.hero_start_date && new Date(formData.hero_start_date) > now) return true;
    if (formData.hero_end_date && new Date(formData.hero_end_date) < now) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">Homepage Settings</h1>
            <p className="text-muted-foreground mt-1">Customize your storefront hero and featured content</p>
          </div>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-primary border-primary">
              Unsaved changes
            </Badge>
          )}
          {isDraft && (
            <Badge variant="secondary">Draft</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('/', '_blank')}>
            <Eye className="h-4 w-4 mr-2" />
            Live Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, i) => (
            <div key={i} className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-destructive">{warning}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Settings */}
        <div className="space-y-6">
          <Tabs defaultValue="hero">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hero">Hero Section</TabsTrigger>
              <TabsTrigger value="featured">Featured</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="hero" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Hero Section</CardTitle>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="hero-enabled" className="text-sm text-muted-foreground">
                        {formData.hero_enabled ? 'Enabled' : 'Disabled'}
                      </Label>
                      <Switch
                        id="hero-enabled"
                        checked={formData.hero_enabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, hero_enabled: checked })}
                      />
                    </div>
                  </div>
                  {isScheduled() && (
                    <Badge variant="secondary" className="w-fit mt-2">
                      <Clock className="h-3 w-3 mr-1" />
                      Scheduled
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={formData.hero_title}
                      onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                      placeholder="Experience the Birthplace of Coffee"
                    />
                    <span className="text-xs text-muted-foreground">{formData.hero_title.length}/50 characters</span>
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Button</Label>
                      <Input
                        value={formData.hero_button_text}
                        onChange={(e) => setFormData({ ...formData, hero_button_text: e.target.value })}
                        placeholder="Shop Now"
                      />
                      <Input
                        value={formData.hero_button_link}
                        onChange={(e) => setFormData({ ...formData, hero_button_link: e.target.value })}
                        placeholder="/products"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Button (Optional)</Label>
                      <Input
                        value={formData.secondary_button_text}
                        onChange={(e) => setFormData({ ...formData, secondary_button_text: e.target.value })}
                        placeholder="Learn More"
                      />
                      <Input
                        value={formData.secondary_button_link}
                        onChange={(e) => setFormData({ ...formData, secondary_button_link: e.target.value })}
                        placeholder="/about"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Text Alignment</Label>
                    <div className="flex gap-2">
                      {[
                        { value: 'left', icon: AlignLeft },
                        { value: 'center', icon: AlignCenter },
                        { value: 'right', icon: AlignRight },
                      ].map(({ value, icon: Icon }) => (
                        <Button
                          key={value}
                          variant={formData.text_alignment === value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFormData({ ...formData, text_alignment: value as any })}
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Overlay</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <Button
                          variant={formData.overlay_type === 'dark' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFormData({ ...formData, overlay_type: 'dark' })}
                        >
                          <Moon className="h-4 w-4 mr-1" />
                          Dark
                        </Button>
                        <Button
                          variant={formData.overlay_type === 'light' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFormData({ ...formData, overlay_type: 'light' })}
                        >
                          <Sun className="h-4 w-4 mr-1" />
                          Light
                        </Button>
                      </div>
                      <div className="flex-1 space-y-1">
                        <Slider
                          value={[formData.overlay_opacity]}
                          onValueChange={([value]) => setFormData({ ...formData, overlay_opacity: value })}
                          min={0}
                          max={100}
                          step={5}
                        />
                        <span className="text-xs text-muted-foreground">{formData.overlay_opacity}% opacity</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Animation</Label>
                    <Select
                      value={formData.animation}
                      onValueChange={(value) => setFormData({ ...formData, animation: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="fade-in">Fade In</SelectItem>
                        <SelectItem value="slide-up">Slide Up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date (Optional)</Label>
                      <Input
                        type="datetime-local"
                        value={formData.hero_start_date}
                        onChange={(e) => setFormData({ ...formData, hero_start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date (Optional)</Label>
                      <Input
                        type="datetime-local"
                        value={formData.hero_end_date}
                        onChange={(e) => setFormData({ ...formData, hero_end_date: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="featured" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Featured Content</CardTitle>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="featured-enabled" className="text-sm text-muted-foreground">
                        {formData.featured_enabled ? 'Enabled' : 'Disabled'}
                      </Label>
                      <Switch
                        id="featured-enabled"
                        checked={formData.featured_enabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, featured_enabled: checked })}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Add Collection</Label>
                    <Select onValueChange={addCollection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a collection to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {collections
                          .filter(c => !formData.featured_collections.includes(c.id))
                          .map((collection) => (
                            <SelectItem key={collection.id} value={collection.id}>
                              {collection.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.featured_collections.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Collections (drag to reorder)</Label>
                      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={formData.featured_collections} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {formData.featured_collections.map((id) => {
                              const collection = collections.find(c => c.id === id);
                              return collection ? (
                                <SortableCollection
                                  key={id}
                                  id={id}
                                  name={collection.name}
                                  onRemove={() => removeCollection(id)}
                                />
                              ) : null;
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Layout</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={formData.featured_layout === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData({ ...formData, featured_layout: 'grid' })}
                      >
                        <Grid className="h-4 w-4 mr-1" />
                        Grid
                      </Button>
                      <Button
                        variant={formData.featured_layout === 'carousel' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData({ ...formData, featured_layout: 'carousel' })}
                      >
                        <LayoutGrid className="h-4 w-4 mr-1" />
                        Carousel
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Products to Display</Label>
                    <Select
                      value={formData.product_limit.toString()}
                      onValueChange={(value) => setFormData({ ...formData, product_limit: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 products</SelectItem>
                        <SelectItem value="6">6 products</SelectItem>
                        <SelectItem value="9">9 products</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Insights */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Performance Insights</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant={dateRange === '7d' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDateRange('7d')}
                      >
                        7 days
                      </Button>
                      <Button
                        variant={dateRange === '30d' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDateRange('30d')}
                      >
                        30 days
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Hero Click Rate</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{metrics.heroClickRate}%</span>
                        <span className={`text-sm flex items-center ${metrics.heroClickChange > 0 ? 'text-primary' : 'text-destructive'}`}>
                          {metrics.heroClickChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {Math.abs(metrics.heroClickChange)}%
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Collection Clicks</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{metrics.collectionClicks}</span>
                        <span className={`text-sm flex items-center ${metrics.collectionClickChange > 0 ? 'text-primary' : 'text-destructive'}`}>
                          {metrics.collectionClickChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {Math.abs(metrics.collectionClickChange)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Version History
                  </CardTitle>
                  <CardDescription>Restore previous versions of your homepage settings</CardDescription>
                </CardHeader>
                <CardContent>
                  {versionHistory.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No version history yet. Save changes to create versions.</p>
                  ) : (
                    <div className="space-y-2">
                      {versionHistory.map((version, index) => (
                        <div key={version.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium text-sm">
                              {index === 0 ? 'Current Version' : `Version ${versionHistory.length - index}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(version.timestamp, 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          {index !== 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => restoreVersion(version)}
                            >
                              <Undo2 className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Live Preview</CardTitle>
                <div className="flex gap-1">
                  {[
                    { value: 'desktop', icon: Monitor },
                    { value: 'tablet', icon: Tablet },
                    { value: 'mobile', icon: Smartphone },
                  ].map(({ value, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={devicePreview === value ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setDevicePreview(value as DevicePreview)}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`mx-auto transition-all duration-300 ${getPreviewWidth()}`}>
                {previewLoading ? (
                  <Skeleton className="h-[300px] rounded-lg" />
                ) : (
                  <>
                    {/* Hero Preview */}
                    {formData.hero_enabled && (
                      <div
                        className={`relative rounded-lg overflow-hidden ${getAnimationClass()}`}
                        style={{
                          backgroundImage: formData.hero_image_url ? `url(${formData.hero_image_url})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          minHeight: devicePreview === 'mobile' ? '200px' : '300px',
                        }}
                      >
                        <div 
                          className="absolute inset-0" 
                          style={{
                            backgroundColor: formData.overlay_type === 'dark' ? 'black' : 'white',
                            opacity: formData.overlay_opacity / 100,
                          }}
                        />
                        <div className={`relative z-10 p-8 flex flex-col justify-center min-h-[inherit] ${getAlignmentClass()}`}>
                          <h2 className={`${devicePreview === 'mobile' ? 'text-xl' : 'text-3xl'} font-bold mb-2 ${formData.overlay_type === 'dark' ? 'text-white' : 'text-foreground'}`}>
                            {formData.hero_title || 'Your Hero Title'}
                          </h2>
                          <p className={`${devicePreview === 'mobile' ? 'text-sm' : 'text-lg'} opacity-90 mb-6 max-w-2xl ${formData.overlay_type === 'dark' ? 'text-white' : 'text-foreground'}`}>
                            {formData.hero_subtitle || 'Your subtitle text goes here'}
                          </p>
                          <div className="flex gap-3 flex-wrap">
                            <Button
                              size={devicePreview === 'mobile' ? 'sm' : 'lg'}
                              onClick={() => formData.hero_button_link && window.open(formData.hero_button_link, '_blank')}
                              className="cursor-pointer hover:scale-105 transition-transform"
                            >
                              {formData.hero_button_text || 'Button Text'}
                            </Button>
                            {formData.secondary_button_text && (
                              <Button
                                variant="outline"
                                size={devicePreview === 'mobile' ? 'sm' : 'lg'}
                                onClick={() => formData.secondary_button_link && window.open(formData.secondary_button_link, '_blank')}
                                className={`cursor-pointer hover:scale-105 transition-transform ${formData.overlay_type === 'dark' ? 'border-white text-white hover:bg-white/10' : ''}`}
                              >
                                {formData.secondary_button_text}
                              </Button>
                            )}
                          </div>
                        </div>
                        {!formData.hero_enabled && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                            <Badge variant="secondary">Section Disabled</Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Featured Content Preview */}
                    {formData.featured_enabled && formData.featured_collections.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-semibold mb-3">Featured Collections</h3>
                        <div className={`grid gap-3 ${formData.featured_layout === 'grid' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                          {formData.featured_collections.slice(0, formData.product_limit / 2).map(id => {
                            const collection = collections.find(c => c.id === id);
                            return collection ? (
                              <div key={id} className="p-3 bg-muted rounded-lg text-center text-sm">
                                {collection.name}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Quick Tips
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Use high-quality images (1920x1080 recommended)</li>
                <li>• Keep titles short and impactful (&lt;50 chars)</li>
                <li>• Rotate featured collections seasonally</li>
                <li>• Test on mobile to ensure readability</li>
                <li>• Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘S</kbd> to save quickly</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomepageSettingsComponent;
