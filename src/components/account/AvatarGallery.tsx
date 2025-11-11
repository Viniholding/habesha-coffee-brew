import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Check } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: any;
}

interface AvatarGalleryProps {
  userId: string;
  currentAvatarUrl: string;
  onAvatarSelect: (url: string) => void;
}

const AvatarGallery = ({ userId, currentAvatarUrl, onAvatarSelect }: AvatarGalleryProps) => {
  const [avatars, setAvatars] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [avatarToDelete, setAvatarToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchAvatars();
  }, [userId]);

  const fetchAvatars = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("avatars")
        .list(userId, {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) throw error;
      setAvatars(data || []);
    } catch (error) {
      console.error("Error fetching avatars:", error);
      toast.error("Failed to load avatar gallery");
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (fileName: string) => {
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(`${userId}/${fileName}`);
    return publicUrl;
  };

  const handleSelectAvatar = async (fileName: string) => {
    const avatarUrl = getAvatarUrl(fileName);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      if (error) throw error;
      
      onAvatarSelect(avatarUrl);
      toast.success("Avatar updated successfully");
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast.error("Failed to update avatar");
    }
  };

  const handleDeleteAvatar = async () => {
    if (!avatarToDelete) return;

    try {
      const { error } = await supabase.storage
        .from("avatars")
        .remove([`${userId}/${avatarToDelete}`]);

      if (error) throw error;
      
      toast.success("Avatar deleted successfully");
      fetchAvatars();
      
      // If deleted avatar was current, clear it from profile
      const deletedUrl = getAvatarUrl(avatarToDelete);
      if (currentAvatarUrl === deletedUrl) {
        await supabase
          .from("profiles")
          .update({ avatar_url: null })
          .eq("id", userId);
        onAvatarSelect("");
      }
    } catch (error) {
      console.error("Error deleting avatar:", error);
      toast.error("Failed to delete avatar");
    } finally {
      setDeleteDialogOpen(false);
      setAvatarToDelete(null);
    }
  };

  const confirmDelete = (fileName: string) => {
    setAvatarToDelete(fileName);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Avatar Gallery</CardTitle>
          <CardDescription>
            View and manage all your uploaded profile pictures
          </CardDescription>
        </CardHeader>
        <CardContent>
          {avatars.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No uploaded avatars yet. Upload one from your profile settings.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {avatars.map((avatar) => {
                const avatarUrl = getAvatarUrl(avatar.name);
                const isActive = currentAvatarUrl === avatarUrl;
                
                return (
                  <div
                    key={avatar.id}
                    className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isActive
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                    {isActive && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!isActive && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSelectAvatar(avatar.name)}
                        >
                          Use
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => confirmDelete(avatar.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Avatar</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this avatar? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAvatar}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AvatarGallery;
