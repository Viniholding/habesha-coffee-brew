import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
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
        from: "Habesha Coffee <onboarding@resend.dev>",
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  logStep("Processing checkout.session.completed", { sessionId: session.id });

  const metadata = session.metadata || {};
  const userId = metadata.user_id;
  const isGift = metadata.is_gift === "true";
  const isPrepaid = metadata.is_prepaid === "true";

  if (!userId) {
    logStep("No user_id in metadata, skipping");
    return;
  }

  // Get user email
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("email, first_name")
    .eq("id", userId)
    .single();

  // Calculate next delivery date based on frequency
  const frequencyDays: Record<string, number> = {
    weekly: 7,
    biweekly: 14,
    every_3_weeks: 21,
    every_4_weeks: 28,
    monthly: 30,
  };
  const days = frequencyDays[metadata.frequency] || 14;
  const nextDeliveryDate = new Date();
  nextDeliveryDate.setDate(nextDeliveryDate.getDate() + days);

  // Create subscription in database
  const subscriptionData: any = {
    user_id: userId,
    product_id: metadata.product_id,
    product_name: metadata.product_name,
    grind: metadata.grind || "whole_bean",
    bag_size: metadata.bag_size || "12oz",
    frequency: metadata.frequency || "biweekly",
    quantity: parseInt(metadata.quantity) || 1,
    price: (session.amount_total || 0) / 100,
    status: "active",
    next_delivery_date: nextDeliveryDate.toISOString().split("T")[0],
  };

  if (session.subscription) {
    subscriptionData.stripe_subscription_id = session.subscription as string;
    subscriptionData.stripe_customer_id = session.customer as string;
  }

  if (isGift) {
    subscriptionData.is_gift = true;
    subscriptionData.gift_recipient_name = metadata.gift_recipient_name;
    subscriptionData.gift_recipient_email = metadata.gift_recipient_email;
    subscriptionData.gift_message = metadata.gift_message;
    const giftDuration = parseInt(metadata.gift_duration) || 3;
    const giftEndDate = new Date();
    giftEndDate.setMonth(giftEndDate.getMonth() + giftDuration);
    subscriptionData.gift_end_date = giftEndDate.toISOString().split("T")[0];
  }

  if (isPrepaid) {
    subscriptionData.is_prepaid = true;
    subscriptionData.prepaid_months = parseInt(metadata.prepaid_months) || 3;
    const prepaidEndDate = new Date();
    prepaidEndDate.setMonth(prepaidEndDate.getMonth() + subscriptionData.prepaid_months);
    subscriptionData.prepaid_end_date = prepaidEndDate.toISOString().split("T")[0];
  }

  const { data: subscription, error } = await supabaseClient
    .from("subscriptions")
    .insert(subscriptionData)
    .select()
    .single();

  if (error) {
    logStep("Error creating subscription", { error });
    return;
  }

  logStep("Subscription created", { subscriptionId: subscription.id });

  // Log subscription event
  await supabaseClient.from("subscription_events").insert({
    subscription_id: subscription.id,
    event_type: "created",
    event_data: { source: "stripe_webhook", session_id: session.id },
  });

  // Send confirmation email
  if (profile?.email) {
    await sendEmail(
      profile.email,
      "Your Habesha Coffee Subscription is Confirmed!",
      `
        <h1>Welcome to Habesha Coffee, ${profile.first_name || "Coffee Lover"}!</h1>
        <p>Your subscription to <strong>${metadata.product_name}</strong> has been confirmed.</p>
        <h3>Order Details:</h3>
        <ul>
          <li><strong>Product:</strong> ${metadata.product_name}</li>
          <li><strong>Grind:</strong> ${metadata.grind || "Whole Bean"}</li>
          <li><strong>Size:</strong> ${metadata.bag_size || "12oz"}</li>
          <li><strong>Quantity:</strong> ${metadata.quantity || 1}</li>
          <li><strong>Delivery:</strong> ${metadata.frequency?.replace("_", " ") || "Every 2 weeks"}</li>
        </ul>
        <p>Your first shipment will arrive within 3-5 business days.</p>
        <p>Thank you for choosing Habesha Coffee!</p>
      `
    );
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  logStep("Processing invoice.paid", { invoiceId: invoice.id });

  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  // Get subscription from database
  const { data: subscription } = await supabaseClient
    .from("subscriptions")
    .select("*, profiles:user_id(email, first_name)")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!subscription) {
    logStep("Subscription not found", { stripeSubscriptionId: subscriptionId });
    return;
  }

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // Get any pending add-ons
  const { data: addons } = await supabaseClient
    .from("subscription_addons")
    .select("*, products:product_id(name, price)")
    .eq("subscription_id", subscription.id)
    .eq("status", "pending");

  // Calculate totals
  let subtotal = subscription.price * subscription.quantity;
  const orderItems: any[] = [
    {
      product_name: subscription.product_name,
      product_description: `${subscription.grind} - ${subscription.bag_size}`,
      quantity: subscription.quantity,
      unit_price: subscription.price,
      total_price: subscription.price * subscription.quantity,
    },
  ];

  // Add add-on items
  if (addons && addons.length > 0) {
    for (const addon of addons) {
      const product = addon.products as any;
      orderItems.push({
        product_name: product.name,
        quantity: addon.quantity,
        unit_price: addon.unit_price,
        total_price: addon.unit_price * addon.quantity,
      });
      subtotal += addon.unit_price * addon.quantity;
    }
  }

  const tax = subtotal * 0.08;
  const shipping = 0; // Free shipping for subscriptions
  const total = subtotal + tax + shipping;

  // Create order
  const { data: order, error: orderError } = await supabaseClient
    .from("orders")
    .insert({
      user_id: subscription.user_id,
      order_number: orderNumber,
      status: "processing",
      subtotal,
      tax,
      shipping,
      total,
      shipping_address_id: subscription.shipping_address_id,
    })
    .select()
    .single();

  if (orderError) {
    logStep("Error creating order", { error: orderError });
    return;
  }

  // Insert order items
  for (const item of orderItems) {
    await supabaseClient.from("order_items").insert({
      order_id: order.id,
      ...item,
    });
  }

  // Mark add-ons as processed
  if (addons && addons.length > 0) {
    await supabaseClient
      .from("subscription_addons")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("subscription_id", subscription.id)
      .eq("status", "pending");
  }

  // Update subscription with last order
  const nextDeliveryDate = new Date();
  const frequencyDays: Record<string, number> = {
    weekly: 7,
    biweekly: 14,
    every_3_weeks: 21,
    every_4_weeks: 28,
    monthly: 30,
  };
  nextDeliveryDate.setDate(nextDeliveryDate.getDate() + (frequencyDays[subscription.frequency] || 14));

  await supabaseClient
    .from("subscriptions")
    .update({
      last_order_id: order.id,
      next_delivery_date: nextDeliveryDate.toISOString().split("T")[0],
    })
    .eq("id", subscription.id);

  // Log event
  await supabaseClient.from("subscription_events").insert({
    subscription_id: subscription.id,
    event_type: "order_created",
    event_data: { order_id: order.id, order_number: orderNumber },
  });

  logStep("Order created from invoice", { orderId: order.id, orderNumber });

  // Send order confirmation email
  const profile = subscription.profiles as any;
  if (profile?.email) {
    await sendEmail(
      profile.email,
      `Order Confirmed - ${orderNumber}`,
      `
        <h1>Your Order is Confirmed!</h1>
        <p>Hi ${profile.first_name || "there"},</p>
        <p>We've received your subscription order and it's being prepared for shipment.</p>
        <h3>Order #${orderNumber}</h3>
        <ul>
          ${orderItems.map((item) => `<li>${item.quantity}x ${item.product_name} - $${item.total_price.toFixed(2)}</li>`).join("")}
        </ul>
        <p><strong>Total:</strong> $${total.toFixed(2)}</p>
        <p>You'll receive a shipping confirmation email once your order is on its way.</p>
      `
    );
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logStep("Processing invoice.payment_failed", { invoiceId: invoice.id });

  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const { data: subscription } = await supabaseClient
    .from("subscriptions")
    .select("*, profiles:user_id(email, first_name)")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!subscription) return;

  // Log event
  await supabaseClient.from("subscription_events").insert({
    subscription_id: subscription.id,
    event_type: "payment_failed",
    event_data: { invoice_id: invoice.id, attempt_count: invoice.attempt_count },
  });

  // Send payment failed email
  const profile = subscription.profiles as any;
  if (profile?.email) {
    await sendEmail(
      profile.email,
      "Payment Failed - Action Required",
      `
        <h1>Payment Failed</h1>
        <p>Hi ${profile.first_name || "there"},</p>
        <p>We were unable to process your payment for your ${subscription.product_name} subscription.</p>
        <p>Please update your payment method to continue receiving your coffee deliveries.</p>
        <p><a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/account?tab=subscriptions">Update Payment Method</a></p>
        <p>If you have any questions, please contact our support team.</p>
      `
    );
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logStep("Processing customer.subscription.updated", { subscriptionId: subscription.id });

  const status = subscription.status === "active" ? "active" : 
                 subscription.status === "past_due" ? "past_due" :
                 subscription.status === "canceled" ? "cancelled" :
                 subscription.status === "paused" ? "paused" : "active";

  await supabaseClient
    .from("subscriptions")
    .update({ 
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  logStep("Subscription status updated", { stripeId: subscription.id, status });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logStep("Processing customer.subscription.deleted", { subscriptionId: subscription.id });

  const { data: sub } = await supabaseClient
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (sub) {
    await supabaseClient
      .from("subscriptions")
      .update({ 
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id);

    await supabaseClient.from("subscription_events").insert({
      subscription_id: sub.id,
      event_type: "cancelled",
      event_data: { source: "stripe_webhook" },
    });
  }

  logStep("Subscription cancelled via webhook");
}

async function handleUpcomingInvoice(invoice: Stripe.Invoice) {
  logStep("Processing invoice.upcoming", { customerId: invoice.customer });

  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const { data: subscription } = await supabaseClient
    .from("subscriptions")
    .select("*, profiles:user_id(email, first_name)")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!subscription) return;

  const profile = subscription.profiles as any;
  if (profile?.email) {
    const chargeDate = new Date();
    chargeDate.setDate(chargeDate.getDate() + 3);

    await sendEmail(
      profile.email,
      "Upcoming Subscription Charge",
      `
        <h1>Upcoming Charge Notice</h1>
        <p>Hi ${profile.first_name || "there"},</p>
        <p>Your next subscription charge of <strong>$${subscription.price.toFixed(2)}</strong> for ${subscription.product_name} will be processed on ${chargeDate.toLocaleDateString()}.</p>
        <p>Want to make changes? <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/account?tab=subscriptions">Manage your subscription</a></p>
      `
    );
  }
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    logStep("Missing signature or webhook secret");
    return new Response("Webhook signature missing", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    logStep("Webhook event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "invoice.upcoming":
        await handleUpcomingInvoice(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("Webhook error", { error: String(error) });
    return new Response(`Webhook Error: ${error}`, { status: 400 });
  }
});
