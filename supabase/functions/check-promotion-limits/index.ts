import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getClientId, checkRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientId = getClientId(req);
  const rateLimitResponse = checkRateLimit(clientId, RATE_LIMITS.scheduler, corsHeaders);
  if (rateLimitResponse) {
    console.log(`[CHECK-PROMOTION-LIMITS] Rate limited: ${clientId}`);
    return rateLimitResponse;
  }

  try {
    console.log("Starting promotion limit check...");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch promotions that have a max_uses limit and are active
    const { data: promotions, error: promoError } = await supabase
      .from("promotions")
      .select("id, code, current_uses, max_uses, description")
      .eq("is_active", true)
      .not("max_uses", "is", null);

    if (promoError) {
      console.error("Error fetching promotions:", promoError);
      throw promoError;
    }

    console.log(`Found ${promotions?.length || 0} promotions with limits`);

    // Find promotions at or above 80% usage
    const alertThreshold = 0.8;
    const promotionsNearLimit = promotions?.filter(promo => {
      if (!promo.max_uses) return false;
      const usagePercentage = promo.current_uses / promo.max_uses;
      return usagePercentage >= alertThreshold;
    }) || [];

    if (promotionsNearLimit.length === 0) {
      console.log("No promotions near their limit");
      return new Response(
        JSON.stringify({ message: "No promotions near limit", checked: promotions?.length || 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`${promotionsNearLimit.length} promotions near their limit`);

    // Get admin users to notify
    const { data: adminRoles, error: adminError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminError) {
      console.error("Error fetching admins:", adminError);
      throw adminError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found to notify");
      return new Response(
        JSON.stringify({ message: "No admins to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get admin emails
    const adminIds = adminRoles.map(r => r.user_id);
    const { data: adminProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .in("id", adminIds);

    if (profileError) {
      console.error("Error fetching admin profiles:", profileError);
      throw profileError;
    }

    const adminEmails = adminProfiles?.map(p => p.email).filter(Boolean) || [];
    
    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return new Response(
        JSON.stringify({ message: "No admin emails found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending alerts to ${adminEmails.length} admin(s)`);

    // Build promotion list for email
    const promotionList = promotionsNearLimit.map(promo => {
      const percentage = Math.round((promo.current_uses / promo.max_uses!) * 100);
      return `<li><strong>${promo.code}</strong>: ${promo.current_uses}/${promo.max_uses} uses (${percentage}%)</li>`;
    }).join("");

    // Send email to all admins using Resend API directly
    for (const email of adminEmails) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Habesha Coffee <op@coffeehabesha.com>",
          to: [email],
          subject: "⚠️ Promotion Usage Alert - Codes Nearing Limit",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #8B4513;">Promotion Usage Alert</h1>
              <p>The following promotion codes have reached 80% or more of their usage limit:</p>
              <ul style="background: #f5f5f5; padding: 15px 30px; border-radius: 8px; margin: 20px 0;">
                ${promotionList}
              </ul>
              <p>Please review these promotions and consider:</p>
              <ul>
                <li>Increasing the usage limit if needed</li>
                <li>Creating a new promotion code</li>
                <li>Deactivating the promotion if it should expire</li>
              </ul>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This is an automated alert from your Yeneta Coffee admin system.
              </p>
            </div>
          `,
        }),
      });

      const result = await emailResponse.json();
      console.log(`Email sent to ${email}:`, result);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsSent: adminEmails.length,
        promotionsAlerted: promotionsNearLimit.length 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in check-promotion-limits:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
