import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle, Calendar, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DeletionScheduled() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    const checkDeletionStatus = async () => {
      try {
        const { data, error } = await supabase.rpc("get_scheduled_deletion" as any);
        
        if (error) {
          toast.error("Failed to load deletion information.");
          navigate("/account");
          return;
        }

        if (!data || (Array.isArray(data) && data.length === 0)) {
          // No scheduled deletion found
          navigate("/account");
          return;
        }

        const deletionInfo = Array.isArray(data) ? data[0] : data;
        setScheduledDate(new Date((deletionInfo as any).scheduled_at));
        setDaysRemaining(Math.ceil((deletionInfo as any).days_remaining));
      } catch (error) {
        console.error("Error checking deletion status:", error);
        toast.error("An error occurred.");
        navigate("/account");
      } finally {
        setLoading(false);
      }
    };

    checkDeletionStatus();
  }, [navigate]);

  const handleCancel = async () => {
    setCanceling(true);
    try {
      const { error } = await supabase.rpc("cancel_account_deletion" as any);
      
      if (error) throw error;

      toast.success("Account deletion cancelled successfully!");
      navigate("/account");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel deletion.");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="max-w-lg w-full border-warning/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <Calendar className="h-5 w-5" />
              Account Deletion Scheduled
            </CardTitle>
            <CardDescription>
              Your account is scheduled to be permanently deleted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Deletion Date</AlertTitle>
              <AlertDescription>
                {scheduledDate && (
                  <div className="mt-2">
                    <p className="font-semibold text-lg">
                      {scheduledDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-muted-foreground mt-1">
                      {daysRemaining !== null && daysRemaining > 0 && (
                        <>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining</>
                      )}
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your account will remain active until the deletion date. You can cancel this deletion 
                request at any time before then.
              </p>
              
              <p className="text-sm text-muted-foreground">
                Once deleted, all your data including orders, subscriptions, and profile information 
                will be permanently removed and cannot be recovered.
              </p>
            </div>

            <div className="space-y-2 pt-4">
              <Button
                variant="default"
                className="w-full"
                onClick={handleCancel}
                disabled={canceling}
              >
                {canceling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Canceling…
                  </>
                ) : (
                  "Cancel Deletion & Keep Account"
                )}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/account")}
              >
                Back to Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
