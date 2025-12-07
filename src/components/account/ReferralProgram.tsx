import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, Copy, Check, Users, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Referral {
  id: string;
  referral_code: string;
  referee_email: string | null;
  status: string;
  referrer_credited: boolean;
  created_at: string;
  converted_at: string | null;
}

interface ReferralProgramProps {
  userId: string;
}

export default function ReferralProgram({ userId }: ReferralProgramProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferrals();
  }, [userId]);

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReferrals(data || []);
      
      // Find or set the user's referral code
      const activeCode = data?.find((r) => r.status === "pending" || r.status === "active");
      if (activeCode) {
        setReferralCode(activeCode.referral_code);
      }
    } catch (error) {
      console.error("Error fetching referrals:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    setGenerating(true);
    try {
      // Generate a unique code
      const code = `COFFEE${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const { error } = await supabase.from("referrals").insert({
        referrer_user_id: userId,
        referral_code: code,
        status: "pending",
      });

      if (error) throw error;

      setReferralCode(code);
      toast.success("Referral code generated!");
      fetchReferrals();
    } catch (error: any) {
      console.error("Error generating referral code:", error);
      toast.error("Failed to generate referral code");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!referralCode) return;
    
    const referralUrl = `${window.location.origin}/subscribe?ref=${referralCode}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const convertedCount = referrals.filter((r) => r.status === "converted").length;
  const pendingCount = referrals.filter((r) => r.status === "pending" && r.referee_email).length;
  const totalEarned = convertedCount * 10; // $10 credit per referral

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Referral Program
        </CardTitle>
        <CardDescription>
          Share your love of coffee and earn rewards! Get 10% off your next order for each friend who subscribes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{convertedCount}</p>
            <p className="text-xs text-muted-foreground">Successful Referrals</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Gift className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">${totalEarned}</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </div>
        </div>

        {/* Referral Code */}
        <div className="space-y-3">
          <h4 className="font-medium">Your Referral Link</h4>
          {referralCode ? (
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/subscribe?ref=${referralCode}`}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={copyToClipboard} variant="outline" size="icon">
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <Button onClick={generateReferralCode} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Generate Referral Code
                </>
              )}
            </Button>
          )}
        </div>

        {/* How it works */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">How It Works</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">1</span>
              <p>Share your unique referral link with friends and family</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">2</span>
              <p>They get <strong>15% off</strong> their first subscription order</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">3</span>
              <p>You get <strong>10% off</strong> your next order when they subscribe</p>
            </div>
          </div>
        </div>

        {/* Referral History */}
        {referrals.filter((r) => r.referee_email).length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Referral History</h4>
            <div className="space-y-2">
              {referrals
                .filter((r) => r.referee_email)
                .map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg"
                  >
                    <span className="text-sm">{referral.referee_email}</span>
                    <Badge
                      variant={referral.status === "converted" ? "default" : "secondary"}
                    >
                      {referral.status}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
