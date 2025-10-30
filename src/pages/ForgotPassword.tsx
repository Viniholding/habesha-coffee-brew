import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import logo from "@/assets/logo.png";
import forgotPasswordBg from "@/assets/forgot-password-bg.jpg";

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    }
    
    setLoading(false);
  };

  return (
    <>
      <Navigation />
      <div 
        className="min-h-screen flex items-center justify-center px-4 pt-24 relative"
        style={{
          backgroundImage: `url(${forgotPasswordBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
        <Card className="w-full max-w-sm relative z-10 shadow-2xl bg-background/50 backdrop-blur-md border-white/20">
          <CardHeader className="space-y-3">
            <div className="flex justify-center">
              <img src={logo} alt="Coffee Habesha" className="h-12 w-auto" />
            </div>
            <CardTitle className="text-xl text-center">Reset Password</CardTitle>
            <CardDescription className="text-center text-sm">
              {sent 
                ? "Check your email for the reset link"
                : "Enter your email to receive a password reset link"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!sent ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <div className="text-center mt-4">
                  <a href="/auth" className="text-sm text-primary hover:underline">
                    Back to Login
                  </a>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-center text-muted-foreground">
                  We've sent a password reset link to <strong>{email}</strong>. 
                  Click the link in the email to reset your password.
                </p>
                <Button className="w-full" asChild>
                  <a href="/auth">Back to Login</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ForgotPassword;