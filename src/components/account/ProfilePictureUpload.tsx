import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Camera, Upload } from "lucide-react";
import ImageCropper from "./ImageCropper";
import coffeeCup from "@/assets/avatars/coffee-cup.png";
import coffeeBean from "@/assets/avatars/coffee-bean.png";
import farmer from "@/assets/avatars/farmer.png";
import jebena from "@/assets/avatars/jebena.png";
import coffeePlant from "@/assets/avatars/coffee-plant.png";
import espressoMachine from "@/assets/avatars/espresso-machine.png";

const defaultAvatars = [
  { id: "coffee-cup", src: coffeeCup, name: "Coffee Cup" },
  { id: "coffee-bean", src: coffeeBean, name: "Coffee Bean" },
  { id: "farmer", src: farmer, name: "Coffee Farmer" },
  { id: "jebena", src: jebena, name: "Jebena Pot" },
  { id: "coffee-plant", src: coffeePlant, name: "Coffee Plant" },
  { id: "espresso-machine", src: espressoMachine, name: "Espresso Machine" },
];

interface ProfilePictureUploadProps {
  userId: string;
  currentAvatarUrl?: string;
  onAvatarUpdate: (url: string) => void;
}

const ProfilePictureUpload = ({ userId, currentAvatarUrl, onAvatarUpdate }: ProfilePictureUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Read file and show cropper
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    try {
      setUploading(true);
      setCropperOpen(false);
      
      const timestamp = Date.now();
      const filePath = `${userId}/avatar-${timestamp}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedImage, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      onAvatarUpdate(publicUrl);
      toast.success("Profile picture updated successfully");
      setOpen(false);
      setImageToCrop(null);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    setImageToCrop(null);
  };

  const selectDefaultAvatar = async (avatarSrc: string) => {
    try {
      setUploading(true);
      
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarSrc })
        .eq("id", userId);

      if (error) throw error;

      onAvatarUpdate(avatarSrc);
      toast.success("Profile picture updated successfully");
      setOpen(false);
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast.error("Failed to update profile picture");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          open={cropperOpen}
        />
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-0 right-0 rounded-full h-10 w-10 border-2 border-background bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Camera className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Change Profile Picture</DialogTitle>
          <DialogDescription>
            Choose a default avatar or upload your own image
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Default Avatars</h3>
            <div className="grid grid-cols-3 gap-3">
              {defaultAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => selectDefaultAvatar(avatar.src)}
                  disabled={uploading}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <img
                    src={avatar.src}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div>
            <label htmlFor="avatar-upload">
              <Button
                variant="outline"
                className="w-full"
                disabled={uploading}
                asChild
              >
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Your Own"}
                </span>
              </Button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Max file size: 5MB. Supported formats: JPG, PNG, WEBP
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ProfilePictureUpload;
