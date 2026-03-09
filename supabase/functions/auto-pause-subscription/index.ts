import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getClientId, checkRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AUTO-PAUSE-SUBSCRIPTION] ${step}${detailsStr}`);
};

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    logStep("RESEND_API_KEY not set, skipping email");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Habesha Coffee <op@coffeehabesha.com>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      logStep("Email send failed", await response.text());
    } else {
      logStep("Email sent successfully", { to, subject });
    }
  } catch (error) {
    logStep("Email error", { error: String(error) });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientId = getClientId(req);
  const rateLimitResponse = checkRateLimit(clientId, RATE_LIMITS.scheduler, corsHeaders);
  if (rateLimitResponse) {
    logStep("Rate limited", { clientId });
    return rateLimitResponse;
  }

  try {
    logStep("Starting auto-pause check for failed payments");

    // Find subscriptions that have 3 or more payment_failed events in the last 30 days
    // and are not already paused or cancelled
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all subscriptions that are past_due
    const { data: pastDueSubscriptions, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("id, stripe_subscription_id, user_id, product_name")
      .eq("status", "past_due");

    if (subError) {
      logStep("Error fetching subscriptions", { error: subError });
      throw subError;
    }

    logStep("Found past_due subscriptions", { count: pastDueSubscriptions?.length || 0 });

    const pausedSubscriptions: string[] = [];

    for (const subscription of pastDueSubscriptions || []) {
      // Count payment_failed events for this subscription in the last 30 days
      const { count, error: eventError } = await supabaseClient
        .from("subscription_events")
        .select("*", { count: "exact", head: true })
        .eq("subscription_id", subscription.id)
        .eq("event_type", "payment_failed")
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (eventError) {
        logStep("Error counting events", { subscriptionId: subscription.id, error: eventError });
        continue;
      }

      logStep("Payment failure count", { subscriptionId: subscription.id, count });

      if (count && count >= 3) {
        logStep("Auto-pausing subscription due to 3+ failed payments", { 
          subscriptionId: subscription.id 
        });

        // Pause the subscription in Stripe if it has a stripe_subscription_id
        if (subscription.stripe_subscription_id) {
          try {
            await stripe.subscriptions.update(subscription.stripe_subscription_id, {
              pause_collection: {
                behavior: "void",
              },
            });
            logStep("Paused in Stripe", { stripeId: subscription.stripe_subscription_id });
          } catch (stripeError) {
            logStep("Stripe pause error", { error: String(stripeError) });
          }
        }

        // Update subscription status in database
        await supabaseClient
          .from("subscriptions")
          .update({
            status: "paused",
            paused_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id);

        // Log the auto-pause event
        await supabaseClient.from("subscription_events").insert({
          subscription_id: subscription.id,
          event_type: "auto_paused",
          event_data: {
            reason: "3_failed_payments",
            failed_payment_count: count,
          },
        });

        // Get user email to notify
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("email, first_name")
          .eq("id", subscription.user_id)
          .single();

        if (profile?.email) {
          await sendEmail(
            profile.email,
            "Your Subscription Has Been Paused",
            `
              <h1>Subscription Paused</h1>
              <p>Hi ${profile.first_name || "there"},</p>
              <p>Due to multiple failed payment attempts, your <strong>${subscription.product_name}</strong> subscription has been automatically paused.</p>
              <p>To resume your subscription and continue receiving your coffee deliveries, please update your payment method.</p>
              <p><a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/account?tab=subscriptions" style="display: inline-block; background-color: #8B4513; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Update Payment Method</a></p>
              <p>If you have any questions, please contact our support team.</p>
            `
          );
        }

        pausedSubscriptions.push(subscription.id);
      }
    }

    logStep("Auto-pause check completed", { pausedCount: pausedSubscriptions.length });

    return new Response(
      JSON.stringify({
        success: true,
        pausedSubscriptions,
        message: `Auto-paused ${pausedSubscriptions.length} subscriptions due to 3+ failed payments`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    logStep("Error in auto-pause function", { error: String(error) });
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
