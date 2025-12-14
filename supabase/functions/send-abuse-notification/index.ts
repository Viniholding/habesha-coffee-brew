import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[ABUSE-NOTIFICATION] ${step}`, details ? JSON.stringify(details) : '');
};

interface NotificationRequest {
  type: 'account_restricted' | 'restriction_lifted';
  userId: string;
  reason?: string;
  abuseScore?: number;
}

async function sendEmail(to: string[], subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Habesha Coffee <notifications@resend.dev>",
      to,
      subject,
      html,
    }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to send email: ${errorText}`);
  }
  
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, userId, reason, abuseScore }: NotificationRequest = await req.json();
    logStep("Processing notification", { type, userId });

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch user profile: ${profileError?.message}`);
    }

    const customerName = profile.first_name || 'Valued Customer';
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@example.com";

    if (type === 'account_restricted') {
      // Send email to customer
      await sendEmail(
        [profile.email],
        "Important: Your Account Promotional Access Has Been Limited",
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #6B4423;">Account Update</h1>
            <p>Dear ${customerName},</p>
            <p>We've noticed some unusual activity on your account that has triggered our promotional access limits.</p>
            <p>As a result, your access to promotional pricing and discount codes has been temporarily restricted.</p>
            <p><strong>What this means:</strong></p>
            <ul>
              <li>You can still make purchases at regular prices</li>
              <li>Your existing subscriptions remain active</li>
              <li>Promotional codes and subscription discounts are temporarily unavailable</li>
            </ul>
            <p>This restriction will be automatically reviewed and may be lifted after a 30-day cooldown period if no further concerning activity is detected.</p>
            <p>If you believe this is an error, please contact our support team.</p>
            <p>Thank you for your understanding,<br>The Habesha Coffee Team</p>
          </div>
        `
      );
      logStep("Customer restriction email sent", { email: profile.email });

      // Send email to admin
      await sendEmail(
        [adminEmail],
        `[ALERT] Account Auto-Restricted: ${profile.email}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #c53030;">Account Auto-Restriction Alert</h1>
            <p><strong>Account Details:</strong></p>
            <ul>
              <li><strong>User ID:</strong> ${userId}</li>
              <li><strong>Email:</strong> ${profile.email}</li>
              <li><strong>Name:</strong> ${profile.first_name} ${profile.last_name || ''}</li>
              <li><strong>Abuse Score:</strong> ${abuseScore || 'N/A'}</li>
              <li><strong>Reason:</strong> ${reason || 'Automatic threshold exceeded'}</li>
              <li><strong>Restricted At:</strong> ${new Date().toISOString()}</li>
            </ul>
            <p>This account has been automatically restricted from promotional pricing due to exceeding abuse detection thresholds.</p>
            <p>Review this account in the Admin Dashboard.</p>
          </div>
        `
      );
      logStep("Admin alert email sent", { adminEmail });

    } else if (type === 'restriction_lifted') {
      // Send email to customer
      await sendEmail(
        [profile.email],
        "Good News: Your Promotional Access Has Been Restored",
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #6B4423;">Access Restored!</h1>
            <p>Dear ${customerName},</p>
            <p>Great news! Your access to promotional pricing and discount codes has been restored.</p>
            <p>You can now:</p>
            <ul>
              <li>Use promotional codes on eligible purchases</li>
              <li>Access subscription discounts</li>
              <li>Take advantage of special offers</li>
            </ul>
            <p>Thank you for being a valued customer!</p>
            <p>Best regards,<br>The Habesha Coffee Team</p>
          </div>
        `
      );
      logStep("Customer restoration email sent", { email: profile.email });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep("Error sending notification", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
