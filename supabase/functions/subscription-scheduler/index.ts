import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getClientId, checkRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBSCRIPTION-SCHEDULER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting for scheduler
  const clientId = getClientId(req);
  const rateLimitResponse = checkRateLimit(clientId, RATE_LIMITS.scheduler, corsHeaders);
  if (rateLimitResponse) {
    logStep("Rate limited", { clientId });
    return rateLimitResponse;
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  try {
    logStep("Function started - checking scheduled resumes");

    // Find subscriptions that should be resumed
    const { data: toResume, error: resumeError } = await supabaseClient
      .from("subscriptions")
      .select("id, stripe_subscription_id, user_id, product_name")
      .eq("status", "paused")
      .not("resume_at", "is", null)
      .lte("resume_at", new Date().toISOString());

    if (resumeError) {
      throw resumeError;
    }

    logStep("Found subscriptions to resume", { count: toResume?.length || 0 });

    const results = {
      resumed: 0,
      errors: 0,
      renewalReminders: 0,
      lowStockAlerts: 0,
    };

    // Resume scheduled subscriptions
    for (const sub of toResume || []) {
      try {
        if (sub.stripe_subscription_id) {
          await stripe.subscriptions.update(sub.stripe_subscription_id, {
            pause_collection: null,
          });
        }

        await supabaseClient
          .from("subscriptions")
          .update({
            status: "active",
            resume_at: null,
            paused_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id);

        // Log event
        await supabaseClient.from("subscription_events").insert({
          subscription_id: sub.id,
          event_type: "auto_resumed",
          event_data: { scheduled: true },
        });

        // Send email notification
        await supabaseClient.functions.invoke("send-subscription-email", {
          body: { type: "subscription_resumed", subscriptionId: sub.id },
        });

        results.resumed++;
        logStep("Resumed subscription", { id: sub.id });
      } catch (err) {
        logStep("Error resuming subscription", { id: sub.id, error: String(err) });
        results.errors++;
      }
    }

    // Send renewal reminders (3 days before next delivery)
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 3);
    const reminderDateStr = reminderDate.toISOString().split("T")[0];

    const { data: upcomingRenewals } = await supabaseClient
      .from("subscriptions")
      .select("id, user_id, product_name, price, next_delivery_date")
      .eq("status", "active")
      .eq("next_delivery_date", reminderDateStr);

    for (const sub of upcomingRenewals || []) {
      try {
        await supabaseClient.functions.invoke("send-subscription-email", {
          body: {
            type: "upcoming_charge",
            subscriptionId: sub.id,
            additionalData: {
              amount: sub.price,
              chargeDate: sub.next_delivery_date,
            },
          },
        });
        results.renewalReminders++;
      } catch (err) {
        logStep("Error sending renewal reminder", { id: sub.id, error: String(err) });
      }
    }

    // Check for low stock on subscribed products
    const { data: subscriptionProducts } = await supabaseClient
      .from("subscriptions")
      .select("product_id, product_name")
      .eq("status", "active");

    const productIds = [...new Set(subscriptionProducts?.map((s) => s.product_id) || [])];

    if (productIds.length > 0) {
      const { data: lowStockProducts } = await supabaseClient
        .from("products")
        .select("id, name, stock_quantity, low_stock_threshold, supplier_email")
        .in("id", productIds)
        .filter("stock_quantity", "lte", "low_stock_threshold");

      for (const product of lowStockProducts || []) {
        // Send alert to admin
        logStep("Low stock alert", {
          product: product.name,
          stock: product.stock_quantity,
          threshold: product.low_stock_threshold,
        });

        // Count active subscriptions for this product
        const { count } = await supabaseClient
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("product_id", product.id)
          .eq("status", "active");

        // Send low stock notification email
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey && product.supplier_email) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: "Habesha Coffee <op@coffeehabesha.com>",
              to: [product.supplier_email],
              subject: `Low Stock Alert: ${product.name}`,
              html: `
                <h2>Low Stock Alert</h2>
                <p>The following product is running low on stock:</p>
                <ul>
                  <li><strong>Product:</strong> ${product.name}</li>
                  <li><strong>Current Stock:</strong> ${product.stock_quantity}</li>
                  <li><strong>Threshold:</strong> ${product.low_stock_threshold}</li>
                  <li><strong>Active Subscriptions:</strong> ${count || 0}</li>
                </ul>
                <p>Please restock soon to avoid fulfillment delays.</p>
              `,
            }),
          });
          results.lowStockAlerts++;
        }
      }
    }

    logStep("Scheduler completed", results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
