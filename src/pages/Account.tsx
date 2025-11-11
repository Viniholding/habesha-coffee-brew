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
import DeliveryPreferences from "@/components/account/DeliveryPreferences";
import DeliveryCalendar from "@/components/account/DeliveryCalendar";
import ProfileSettings from "@/components/account/ProfileSettings";
import { Package, MapPin, CreditCard, Calendar, Truck, User as UserIcon, Settings } from "lucide-react";

const Account = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">My Account</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="settings" className="flex flex-col lg:flex-row gap-6">
            <TabsList className="flex flex-row lg:flex-col h-auto lg:h-fit w-full lg:w-48 gap-2 overflow-x-auto lg:overflow-x-visible">
              <TabsTrigger value="settings" className="flex items-center justify-start gap-2 w-full">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center justify-start gap-2 w-full">
                <Package className="h-4 w-4" />
                <span>Orders</span>
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center justify-start gap-2 w-full">
                <Truck className="h-4 w-4" />
                <span>Tracking</span>
              </TabsTrigger>
              <TabsTrigger value="addresses" className="flex items-center justify-start gap-2 w-full">
                <MapPin className="h-4 w-4" />
                <span>Addresses</span>
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center justify-start gap-2 w-full">
                <CreditCard className="h-4 w-4" />
                <span>Payment</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center justify-start gap-2 w-full">
                <Calendar className="h-4 w-4" />
                <span>Calendar</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 space-y-6">

              <TabsContent value="settings">
                <ProfileSettings userId={user.id} />
              </TabsContent>

              <TabsContent value="orders">
                <OrderHistory userId={user.id} />
              </TabsContent>

              <TabsContent value="tracking">
                <OrderTracking userId={user.id} />
              </TabsContent>

              <TabsContent value="addresses">
                <AddressBook userId={user.id} />
              </TabsContent>

              <TabsContent value="payment">
                <PaymentMethods userId={user.id} />
              </TabsContent>

              <TabsContent value="calendar">
                <DeliveryCalendar userId={user.id} />
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
