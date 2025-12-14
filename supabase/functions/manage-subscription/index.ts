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
  console.log(`[MANAGE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientId = getClientId(req);
  const rateLimitResponse = checkRateLimit(clientId, RATE_LIMITS.api, corsHeaders);
  if (rateLimitResponse) {
    logStep("Rate limited", { clientId });
    return rateLimitResponse;
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
        // Get subscription details first to check deliveries completed for pause safeguard
        const { data: subToPause } = await supabaseClient
          .from("subscriptions")
          .select("id, deliveries_completed, discount_amount, original_price, price, stripe_customer_id, user_id, product_name")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (!subToPause) {
          throw new Error("Subscription not found");
        }

        // Check if early pause (before 2nd delivery) and discount was applied
        const isEarlyPause = (subToPause.deliveries_completed || 0) < 2;
        const pauseDiscountToRecover = subToPause.discount_amount || 0;

        if (isEarlyPause && pauseDiscountToRecover > 0 && subToPause.stripe_customer_id) {
          logStep("Early pause detected - charging back discount", { 
            discountAmount: pauseDiscountToRecover 
          });

          try {
            // Create a one-time charge for the discount amount
            const paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(pauseDiscountToRecover * 100),
              currency: "usd",
              customer: subToPause.stripe_customer_id,
              description: "Subscription discount reversal - early pause",
              metadata: {
                subscription_id: subToPause.id,
                reason: "early_pause_discount_reversal",
              },
              confirm: true,
              automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never",
              },
            });

            logStep("Discount reversal charge created for pause", { 
              paymentIntentId: paymentIntent.id,
              amount: pauseDiscountToRecover,
              status: paymentIntent.status
            });

            // Log the reversal event
            await supabaseClient.from("subscription_events").insert({
              subscription_id: subToPause.id,
              event_type: "discount_reversal",
              event_data: { 
                amount: pauseDiscountToRecover,
                payment_intent_id: paymentIntent.id,
                reason: "early_pause",
                deliveries_completed: subToPause.deliveries_completed,
              },
              created_by: user.id,
            });

            // Send discount reversal email
            await supabaseClient.functions.invoke("send-subscription-email", {
              body: { 
                type: "discount_reversal", 
                subscriptionId: subToPause.id,
                additionalData: {
                  action: "paused",
                  originalPrice: subToPause.original_price,
                  discountedPrice: subToPause.price,
                  discountAmount: pauseDiscountToRecover,
                  productName: subToPause.product_name,
                }
              },
            });

            // Clear the discount amount after reversal to prevent double charging
            await supabaseClient
              .from("subscriptions")
              .update({ discount_amount: 0 })
              .eq("id", subToPause.id);

          } catch (chargeError: any) {
            logStep("Discount reversal charge failed for pause", { error: chargeError.message });
            await supabaseClient.from("subscription_events").insert({
              subscription_id: subToPause.id,
              event_type: "discount_reversal_failed",
              event_data: { 
                amount: pauseDiscountToRecover,
                error: chargeError.message,
                reason: "early_pause",
              },
              created_by: user.id,
            });
          }
        }

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
        
        await supabaseClient.from("subscription_events").insert({
          subscription_id: subToPause.id,
          event_type: "paused",
          event_data: { 
            scheduled_resume: resumeAt || null,
            was_early_pause: isEarlyPause,
            discount_recovered: isEarlyPause ? pauseDiscountToRecover : 0,
          },
          created_by: user.id,
        });
        
        // Send pause email
        await supabaseClient.functions.invoke("send-subscription-email", {
          body: { type: "subscription_paused", subscriptionId: subToPause.id },
        });
        
        result = { 
          message: resumeAt ? `Subscription paused until ${resumeAt}` : "Subscription paused",
          discountCharged: isEarlyPause && pauseDiscountToRecover > 0 ? pauseDiscountToRecover : 0,
        };
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
        // Get subscription details first to check deliveries completed
        const { data: subToCancel } = await supabaseClient
          .from("subscriptions")
          .select("id, deliveries_completed, discount_amount, original_price, price, stripe_customer_id, user_id, product_name")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (!subToCancel) {
          throw new Error("Subscription not found");
        }

        logStep("Checking early cancellation", { 
          deliveriesCompleted: subToCancel.deliveries_completed,
          discountAmount: subToCancel.discount_amount 
        });

        // Check if early cancellation (before 2nd delivery) and discount was applied
        const isEarlyCancellation = (subToCancel.deliveries_completed || 0) < 2;
        const discountToRecover = subToCancel.discount_amount || 0;

        if (isEarlyCancellation && discountToRecover > 0 && subToCancel.stripe_customer_id) {
          logStep("Early cancellation detected - charging back discount", { 
            discountAmount: discountToRecover 
          });

          try {
            // Create a one-time charge for the discount amount
            const paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(discountToRecover * 100), // Convert to cents
              currency: "usd",
              customer: subToCancel.stripe_customer_id,
              description: "Subscription discount reversal - early cancellation",
              metadata: {
                subscription_id: subToCancel.id,
                reason: "early_cancellation_discount_reversal",
              },
              confirm: true,
              automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never",
              },
            });

            logStep("Discount reversal charge created", { 
              paymentIntentId: paymentIntent.id,
              amount: discountToRecover,
              status: paymentIntent.status
            });

            // Log the reversal event
            await supabaseClient.from("subscription_events").insert({
              subscription_id: subToCancel.id,
              event_type: "discount_reversal",
              event_data: { 
                amount: discountToRecover,
                payment_intent_id: paymentIntent.id,
                reason: "early_cancellation",
                deliveries_completed: subToCancel.deliveries_completed,
              },
              created_by: user.id,
            });

            // Send discount reversal email
            await supabaseClient.functions.invoke("send-subscription-email", {
              body: { 
                type: "discount_reversal", 
                subscriptionId: subToCancel.id,
                additionalData: {
                  action: "cancelled",
                  originalPrice: subToCancel.original_price,
                  discountedPrice: subToCancel.price,
                  discountAmount: discountToRecover,
                  productName: subToCancel.product_name,
                }
              },
            });

          } catch (chargeError: any) {
            logStep("Discount reversal charge failed", { error: chargeError.message });
            // Log the failed reversal attempt but still proceed with cancellation
            await supabaseClient.from("subscription_events").insert({
              subscription_id: subToCancel.id,
              event_type: "discount_reversal_failed",
              event_data: { 
                amount: discountToRecover,
                error: chargeError.message,
                reason: "early_cancellation",
              },
              created_by: user.id,
            });
          }
        }

        // Proceed with cancellation
        await stripe.subscriptions.cancel(subscriptionId);
        await supabaseClient
          .from("subscriptions")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscriptionId);

        await supabaseClient.from("subscription_events").insert({
          subscription_id: subToCancel.id,
          event_type: "cancelled",
          event_data: {
            was_early_cancellation: isEarlyCancellation,
            discount_recovered: isEarlyCancellation ? discountToRecover : 0,
          },
          created_by: user.id,
        });

        // Send cancellation email
        await supabaseClient.functions.invoke("send-subscription-email", {
          body: { type: "subscription_cancelled", subscriptionId: subToCancel.id },
        });

        result = { 
          message: "Subscription cancelled",
          discountCharged: isEarlyCancellation && discountToRecover > 0 ? discountToRecover : 0,
        };
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