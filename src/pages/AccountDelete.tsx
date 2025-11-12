import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

      // Step 2: confirm with token + typed DELETE
      const { error: confirmErr } = await supabase.rpc("confirm_account_deletion", {
        _token: token,
        _confirmation_text: confirmText,
      });
      if (confirmErr) throw new Error(confirmErr.message);

      toast.success("Your account has been deleted.");
      await supabase.auth.signOut();
      navigate("/goodbye"); // or navigate("/") if you don't have a goodbye page
    } catch (e: any) {
      const msg = e?.message || "Failed to delete account. Please try again.";
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
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Sorry to see you go</CardTitle>
          <CardDescription>
            Deleting your account is permanent and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pw">Password</Label>
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
            <Label htmlFor="del">Type <span className="font-mono font-bold">DELETE</span> to confirm</Label>
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
              {busy ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…</>) : "DELETE PERMANENTLY"}
            </Button>
          ) : (
            <Button variant="secondary" className="w-full" disabled>
              DELETE PERMANENTLY
            </Button>
          )}

          <Button variant="outline" className="w-full" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

