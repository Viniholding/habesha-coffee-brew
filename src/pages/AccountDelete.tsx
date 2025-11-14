import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AccountDelete() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  // Step 1: request a short-lived deletion token on page load
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("request_account_deletion");
      if (error) {
        toast.error(error.message || "Failed to start deletion flow.");
      } else {
        setToken(data);
      }
    })();
  }, []);

  // Only enable the destructive button when both requirements are met
  const canDelete = useMemo(
    () => Boolean(password && confirmText === "DELETE" && token),
    [password, confirmText, token]
  );

  const confirmDelete = async () => {
    if (!canDelete || !token) return;
    setBusy(true);

    try {
      // Re-authenticate with password (updates last_sign_in_at for server-side recent-login check)
      const { data: userRes } = await supabase.auth.getUser();
      const email = userRes?.user?.email;
      if (!email) throw new Error("Not authenticated.");

      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) throw new Error("Invalid password. Please try again.");

      // Step 2: confirm with token + typed DELETE (now schedules deletion for 30 days)
      const { error: confirmErr } = await supabase.rpc("confirm_account_deletion", {
        _token: token,
        _confirmation_text: confirmText,
      });
      if (confirmErr) throw new Error(confirmErr.message);

      toast.success("Account deletion scheduled for 30 days from now.");
      navigate("/account/deletion-scheduled");
    } catch (e: any) {
      const msg = e?.message || "Failed to schedule account deletion. Please try again.";
      if (msg.includes("expired")) {
        toast.error("Deletion request expired. Refresh and try again.");
      } else if (msg.includes('Confirmation text')) {
        toast.error('You must type DELETE exactly to confirm.');
      } else if (msg.includes("Recent password")) {
        toast.error("Please sign in again and retry immediately.");
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 flex items-center justify-center px-4 py-12 min-h-[calc(100vh-200px)]">
">
        <Card className="max-w-lg w-full border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Sorry to See You Go</CardTitle>
            <CardDescription>
              Your account will be scheduled for deletion in 30 days. You can cancel anytime during this period.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>30-Day Cooldown Period:</strong> Your account will remain active for 30 days. 
                You can cancel the deletion anytime during this period by signing in.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="pw">Confirm Your Password</Label>
              <Input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="del">
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </Label>
              <Input
                id="del"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="DELETE"
                className="tracking-widest"
              />
            </div>

            {canDelete ? (
              <Button
                variant="destructive"
                className="w-full"
                onClick={confirmDelete}
                disabled={busy}
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling Deletion…
                  </>
                ) : (
                  "SCHEDULE DELETION (30 Days)"
                )}
              </Button>
            ) : (
              <Button variant="secondary" className="w-full" disabled>
                SCHEDULE DELETION (30 Days)
              </Button>
            )}

            <Button variant="outline" className="w-full" onClick={() => navigate("/account")}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
