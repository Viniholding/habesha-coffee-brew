import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { action, subscriptionId, newFrequency, newQuantity, skipDate, resumeAt } = await req.json();
    logStep("Action requested", { action, subscriptionId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let result: any = {};

    switch (action) {
      case "pause":
        await stripe.subscriptions.update(subscriptionId, {
          pause_collection: { behavior: "void" },
        });
        // Update local DB with optional resume_at date
        const pauseUpdate: Record<string, any> = {
          status: "paused",
          paused_at: new Date().toISOString(),
        };
        if (resumeAt) {
          pauseUpdate.resume_at = resumeAt;
        }
        await supabaseClient
          .from("subscriptions")
          .update(pauseUpdate)
          .eq("stripe_subscription_id", subscriptionId);
        // Log event
        const { data: pausedSub } = await supabaseClient
          .from("subscriptions")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();
        if (pausedSub) {
          await supabaseClient.from("subscription_events").insert({
            subscription_id: pausedSub.id,
            event_type: "paused",
            event_data: resumeAt ? { scheduled_resume: resumeAt } : null,
            created_by: user.id,
          });
          // Send email
          await supabaseClient.functions.invoke("send-subscription-email", {
            body: { type: "subscription_paused", subscriptionId: pausedSub.id },
          });
        }
        result = { message: resumeAt ? `Subscription paused until ${resumeAt}` : "Subscription paused" };
        break;

      case "resume":
        await stripe.subscriptions.update(subscriptionId, {
          pause_collection: null,
        });
        await supabaseClient
          .from("subscriptions")
          .update({ status: "active", paused_at: null, resume_at: null })
          .eq("stripe_subscription_id", subscriptionId);
        const { data: resumedSub } = await supabaseClient
          .from("subscriptions")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();
        if (resumedSub) {
          await supabaseClient.from("subscription_events").insert({
            subscription_id: resumedSub.id,
            event_type: "resumed",
            created_by: user.id,
          });
          // Send email
          await supabaseClient.functions.invoke("send-subscription-email", {
            body: { type: "subscription_resumed", subscriptionId: resumedSub.id },
          });
        }
        result = { message: "Subscription resumed" };
        break;

      case "cancel":
        await stripe.subscriptions.cancel(subscriptionId);
        await supabaseClient
          .from("subscriptions")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscriptionId);
        const { data: cancelledSub } = await supabaseClient
          .from("subscriptions")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();
        if (cancelledSub) {
          await supabaseClient.from("subscription_events").insert({
            subscription_id: cancelledSub.id,
            event_type: "cancelled",
            created_by: user.id,
          });
        }
        result = { message: "Subscription cancelled" };
        break;

      case "skip":
        // Update next billing date to skip this cycle
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const nextBilling = new Date((sub.current_period_end + 7 * 24 * 60 * 60) * 1000);
        await supabaseClient
          .from("subscriptions")
          .update({ next_delivery_date: nextBilling.toISOString().split('T')[0] })
          .eq("stripe_subscription_id", subscriptionId);
        const { data: skippedSub } = await supabaseClient
          .from("subscriptions")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();
        if (skippedSub) {
          await supabaseClient.from("subscription_events").insert({
            subscription_id: skippedSub.id,
            event_type: "skipped",
            event_data: { skipped_date: skipDate },
            created_by: user.id,
          });
        }
        result = { message: "Next delivery skipped" };
        break;

      case "update_frequency":
        // For frequency changes, we'd need to update the subscription items
        // This is complex with Stripe - for now we log the change
        await supabaseClient
          .from("subscriptions")
          .update({ frequency: newFrequency })
          .eq("stripe_subscription_id", subscriptionId);
        result = { message: "Frequency updated" };
        break;

      case "update_quantity":
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const itemId = subscription.items.data[0]?.id;
        if (itemId) {
          await stripe.subscriptionItems.update(itemId, { quantity: newQuantity });
          await supabaseClient
            .from("subscriptions")
            .update({ quantity: newQuantity })
            .eq("stripe_subscription_id", subscriptionId);
        }
        result = { message: "Quantity updated" };
        break;

      default:
        throw new Error("Invalid action");
    }

    logStep("Action completed", result);
    return new Response(JSON.stringify(result), {
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
