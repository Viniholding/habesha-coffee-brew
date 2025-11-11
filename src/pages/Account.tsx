import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import OrderHistory from "@/components/account/OrderHistory";
import OrderTracking from "@/components/account/OrderTracking";
import AddressBook from "@/components/account/AddressBook";
import PaymentMethods from "@/components/account/PaymentMethods";
import DeliveryCalendar from "@/components/account/DeliveryCalendar";
import ProfileSettings from "@/components/account/ProfileSettings";
import SubscriptionManagement from "@/components/account/SubscriptionManagement";
import ProfilePictureUpload from "@/components/account/ProfilePictureUpload";
import AvatarGallery from "@/components/account/AvatarGallery";
import NotificationPreferences from "@/components/account/NotificationPreferences";
import { Package, MapPin, CreditCard, Calendar, Truck, User as UserIcon, Settings, RefreshCw, Images, Bell } from "lucide-react";

const Account = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user?.id]);

  const fetchUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.full_name) {
        const name = data.full_name.split(" ")[0];
        setFirstName(name);
      }
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Profile Header Card */}
          <Card className="mb-8 border-border/50 shadow-lg transition-all duration-300 hover:shadow-xl">
            <CardHeader className="pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-6 w-full sm:w-auto">
                  <div className="relative group">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-4 group-hover:ring-primary/30">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="h-10 w-10 text-primary" />
                      )}
                    </div>
                    {user && (
                      <ProfilePictureUpload
                        userId={user.id}
                        currentAvatarUrl={avatarUrl}
                        onAvatarUpdate={setAvatarUrl}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-3xl font-bold mb-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      {firstName ? `Hi, ${firstName}` : "My Account"}
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">{user.email}</CardDescription>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 w-full sm:w-auto"
                >
                  Sign Out
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Tabs Navigation */}
          <Tabs defaultValue="settings" className="flex flex-col lg:flex-row gap-6">
            <TabsList className="flex flex-row lg:flex-col h-auto lg:h-fit w-full lg:w-56 gap-2 overflow-x-auto lg:overflow-x-visible bg-card/50 p-3 rounded-lg border border-border/50 backdrop-blur-sm">
              <TabsTrigger 
                value="settings" 
                className="flex items-center justify-start gap-3 w-full px-4 py-3 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/50"
              >
                <Settings className="h-4 w-4" />
                <span className="font-medium">Settings</span>
              </TabsTrigger>
              <TabsTrigger 
                value="subscriptions" 
                className="flex items-center justify-start gap-3 w-full px-4 py-3 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/50"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="font-medium">Subscriptions</span>
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="flex items-center justify-start gap-3 w-full px-4 py-3 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/50"
              >
                <Package className="h-4 w-4" />
                <span className="font-medium">Orders</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tracking" 
                className="flex items-center justify-start gap-3 w-full px-4 py-3 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/50"
              >
                <Truck className="h-4 w-4" />
                <span className="font-medium">Tracking</span>
              </TabsTrigger>
              <TabsTrigger 
                value="addresses" 
                className="flex items-center justify-start gap-3 w-full px-4 py-3 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/50"
              >
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Addresses</span>
              </TabsTrigger>
              <TabsTrigger 
                value="payment" 
                className="flex items-center justify-start gap-3 w-full px-4 py-3 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/50"
              >
                <CreditCard className="h-4 w-4" />
                <span className="font-medium">Payment</span>
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="flex items-center justify-start gap-3 w-full px-4 py-3 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/50"
              >
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Calendar</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="flex items-center justify-start gap-3 w-full px-4 py-3 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/50"
              >
                <Bell className="h-4 w-4" />
                <span className="font-medium">Notifications</span>
              </TabsTrigger>
              <TabsTrigger 
                value="gallery" 
                className="flex items-center justify-start gap-3 w-full px-4 py-3 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/50"
              >
                <Images className="h-4 w-4" />
                <span className="font-medium">Avatar Gallery</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1">
              <TabsContent value="settings" className="mt-0 animate-in fade-in-50 duration-300">
                <ProfileSettings userId={user.id} />
              </TabsContent>

              <TabsContent value="subscriptions" className="mt-0 animate-in fade-in-50 duration-300">
                <SubscriptionManagement userId={user.id} />
              </TabsContent>

              <TabsContent value="orders" className="mt-0 animate-in fade-in-50 duration-300">
                <OrderHistory userId={user.id} />
              </TabsContent>

              <TabsContent value="tracking" className="mt-0 animate-in fade-in-50 duration-300">
                <OrderTracking userId={user.id} />
              </TabsContent>

              <TabsContent value="addresses" className="mt-0 animate-in fade-in-50 duration-300">
                <AddressBook userId={user.id} />
              </TabsContent>

              <TabsContent value="payment" className="mt-0 animate-in fade-in-50 duration-300">
                <PaymentMethods userId={user.id} />
              </TabsContent>

              <TabsContent value="calendar" className="mt-0 animate-in fade-in-50 duration-300">
                <DeliveryCalendar userId={user.id} />
              </TabsContent>

              <TabsContent value="notifications" className="mt-0 animate-in fade-in-50 duration-300">
                <NotificationPreferences userId={user.id} />
              </TabsContent>

              <TabsContent value="gallery" className="mt-0 animate-in fade-in-50 duration-300">
                <AvatarGallery 
                  userId={user.id} 
                  currentAvatarUrl={avatarUrl}
                  onAvatarSelect={setAvatarUrl}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Account;
