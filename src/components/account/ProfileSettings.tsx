import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, MapPin, CreditCard, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { profileSchema, passwordSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

interface ProfileSettingsProps {
  userId: string;
}

interface Profile {
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
}

interface Address {
  id: string;
  full_name: string;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

interface PaymentMethod {
  id: string;
  payment_type: string;
  card_brand: string | null;
  card_last_four: string | null;
  is_default: boolean;
}

const ProfileSettings = ({ userId }: ProfileSettingsProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch addresses
      const { data: addressData, error: addressError } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false });

      if (addressError) throw addressError;
      setAddresses(addressData || []);

      // Fetch payment methods
      const { data: paymentData, error: paymentError } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false });

      if (paymentError) throw paymentError;
      setPaymentMethods(paymentData || []);
    } catch (error: any) {
      logger.error("Error fetching data:", error);
      toast.error("Failed to load profile settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    // Validate profile data
    const validation = profileSchema.safeParse({
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      phone: profile.phone || "",
      date_of_birth: profile.date_of_birth || "",
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          date_of_birth: profile.date_of_birth,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Profile updated successfully");
    } catch (error: any) {
      logger.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile) return;

    setIsDeleting(true);

    if (deleteConfirmation !== "DELETE") {
      toast.error("Please type DELETE exactly to confirm");
      setIsDeleting(false);
      return;
    }

    if (!deletePassword) {
      toast.error("Please enter your password");
      setIsDeleting(false);
      return;
    }

    try {
      // Verify password first (this updates last_sign_in_at for recent login check)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: deletePassword,
      });

      if (signInError) {
        toast.error("Incorrect password");
        setIsDeleting(false);
        return;
      }

      // Step 1: Request deletion token
      const { data: token, error: requestError } = await supabase.rpc("request_account_deletion");

      if (requestError || !token) {
        toast.error("Failed to initiate account deletion. Please try again.");
        setIsDeleting(false);
        return;
      }

      // Step 2: Confirm deletion with token and confirmation text
      const { error: confirmError } = await supabase.rpc("confirm_account_deletion", {
        _token: token,
        _confirmation_text: deleteConfirmation,
      });

      if (confirmError) {
        if (confirmError.message.includes("Recent password confirmation required")) {
          toast.error("Please sign in again and retry immediately.");
        } else if (confirmError.message.includes("expired")) {
          toast.error("Deletion request expired. Please try again.");
        } else if (confirmError.message.includes("Confirmation text")) {
          toast.error("You must type DELETE exactly to confirm.");
        } else {
          toast.error("Failed to delete account. Please contact support.");
        }
        setIsDeleting(false);
        return;
      }

      toast.success("Account deletion scheduled for 30 days from now. You can cancel anytime.");
      navigate("/deletion-scheduled");
    } catch (error: any) {
      logger.error("Error deleting account:", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const isDeleteButtonEnabled = deletePassword.length > 0 && deleteConfirmation === "DELETE";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Failed to load profile</p>
        </CardContent>
      </Card>
    );
  }

  const defaultAddress = addresses.find((addr) => addr.is_default);
  const defaultPayment = paymentMethods.find((pm) => pm.is_default);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={profile.first_name || ""}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                placeholder="Enter your first name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={profile.last_name || ""}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profile.email} disabled className="bg-muted" />
            <p className="text-sm text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone || ""}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={profile.date_of_birth || ""}
              onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Information</CardTitle>
          <CardDescription>Your default shipping address</CardDescription>
        </CardHeader>
        <CardContent>
          {defaultAddress ? (
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium">{defaultAddress.full_name}</p>
                <p className="text-sm text-muted-foreground">{defaultAddress.address_line1}</p>
                <p className="text-sm text-muted-foreground">
                  {defaultAddress.city}, {defaultAddress.state} {defaultAddress.postal_code}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link
                  to="#"
                  onClick={() => {
                    const addressTab = document.querySelector('[value="addresses"]');
                    if (addressTab) (addressTab as HTMLElement).click();
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Manage
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">No shipping address on file</p>
              <Button variant="outline" asChild>
                <Link
                  to="#"
                  onClick={() => {
                    const addressTab = document.querySelector('[value="addresses"]');
                    if (addressTab) (addressTab as HTMLElement).click();
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Add Address
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>Your default payment method</CardDescription>
        </CardHeader>
        <CardContent>
          {defaultPayment ? (
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium capitalize">{defaultPayment.card_brand || defaultPayment.payment_type}</p>
                {defaultPayment.card_last_four && (
                  <p className="text-sm text-muted-foreground">•••• {defaultPayment.card_last_four}</p>
                )}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link
                  to="#"
                  onClick={() => {
                    const paymentTab = document.querySelector('[value="payment"]');
                    if (paymentTab) (paymentTab as HTMLElement).click();
                  }}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">No payment method on file</p>
              <Button variant="outline" asChild>
                <Link
                  to="#"
                  onClick={() => {
                    const paymentTab = document.querySelector('[value="payment"]');
                    if (paymentTab) (paymentTab as HTMLElement).click();
                  }}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Add Payment Method
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild variant="destructive" className="w-full">
            <Link to="/account/delete">Delete My Account</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
