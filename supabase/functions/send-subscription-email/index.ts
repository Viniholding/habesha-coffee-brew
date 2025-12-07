import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-SUBSCRIPTION-EMAIL] ${step}${detailsStr}`);
};

type EmailType = 
  | "subscription_created"
  | "subscription_paused"
  | "subscription_resumed"
  | "subscription_cancelled"
  | "upcoming_charge"
  | "order_shipped"
  | "payment_failed";

interface EmailRequest {
  type: EmailType;
  subscriptionId: string;
  additionalData?: Record<string, any>;
}

const emailTemplates: Record<EmailType, { subject: string; getHtml: (data: any) => string }> = {
  subscription_created: {
    subject: "Welcome to Habesha Coffee Subscriptions!",
    getHtml: (data) => `
      <h1>Welcome, ${data.firstName || "Coffee Lover"}!</h1>
      <p>Your subscription to <strong>${data.productName}</strong> has been created successfully.</p>
      <h3>Subscription Details:</h3>
      <ul>
        <li><strong>Product:</strong> ${data.productName}</li>
        <li><strong>Grind:</strong> ${data.grind}</li>
        <li><strong>Size:</strong> ${data.bagSize}</li>
        <li><strong>Frequency:</strong> ${data.frequency}</li>
        <li><strong>Next Delivery:</strong> ${data.nextDeliveryDate}</li>
      </ul>
      <p>Thank you for choosing Habesha Coffee!</p>
    `,
  },
  subscription_paused: {
    subject: "Your Subscription Has Been Paused",
    getHtml: (data) => `
      <h1>Subscription Paused</h1>
      <p>Hi ${data.firstName || "there"},</p>
      <p>Your ${data.productName} subscription has been paused. You won't be charged until you resume it.</p>
      <p>Ready to resume? <a href="${data.accountUrl}">Visit your account</a></p>
    `,
  },
  subscription_resumed: {
    subject: "Your Subscription Has Been Resumed",
    getHtml: (data) => `
      <h1>Welcome Back!</h1>
      <p>Hi ${data.firstName || "there"},</p>
      <p>Your ${data.productName} subscription has been resumed. Your next delivery is scheduled for ${data.nextDeliveryDate}.</p>
    `,
  },
  subscription_cancelled: {
    subject: "We're Sorry to See You Go",
    getHtml: (data) => `
      <h1>Subscription Cancelled</h1>
      <p>Hi ${data.firstName || "there"},</p>
      <p>Your ${data.productName} subscription has been cancelled. We're sorry to see you go!</p>
      <p>If you ever want to come back, we'll be here. <a href="${data.subscribeUrl}">Start a new subscription</a></p>
    `,
  },
  upcoming_charge: {
    subject: "Upcoming Subscription Charge",
    getHtml: (data) => `
      <h1>Heads Up!</h1>
      <p>Hi ${data.firstName || "there"},</p>
      <p>Your next subscription charge of <strong>$${data.amount}</strong> for ${data.productName} will be processed on ${data.chargeDate}.</p>
      <p>Want to make changes? <a href="${data.accountUrl}">Manage your subscription</a></p>
    `,
  },
  order_shipped: {
    subject: "Your Coffee is On Its Way!",
    getHtml: (data) => `
      <h1>Order Shipped!</h1>
      <p>Hi ${data.firstName || "there"},</p>
      <p>Great news! Your order #${data.orderNumber} has shipped.</p>
      ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ""}
      <p>Estimated delivery: ${data.estimatedDelivery || "3-5 business days"}</p>
    `,
  },
  payment_failed: {
    subject: "Payment Failed - Action Required",
    getHtml: (data) => `
      <h1>Payment Failed</h1>
      <p>Hi ${data.firstName || "there"},</p>
      <p>We were unable to process your payment for your ${data.productName} subscription.</p>
      <p>Please update your payment method to continue receiving your coffee deliveries.</p>
      <p><a href="${data.accountUrl}">Update Payment Method</a></p>
    `,
  },
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

    const { type, subscriptionId, additionalData }: EmailRequest = await req.json();
    logStep("Email request", { type, subscriptionId });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Get subscription with user profile
    const { data: subscription, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("*, profiles:user_id(email, first_name)")
      .eq("id", subscriptionId)
      .single();

    if (subError || !subscription) {
      throw new Error("Subscription not found");
    }

    const profile = subscription.profiles as any;
    if (!profile?.email) {
      throw new Error("User email not found");
    }

    const template = emailTemplates[type];
    if (!template) {
      throw new Error(`Unknown email type: ${type}`);
    }

    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "";
    
    const emailData = {
      firstName: profile.first_name,
      productName: subscription.product_name,
      grind: subscription.grind,
      bagSize: subscription.bag_size,
      frequency: subscription.frequency?.replace("_", " "),
      nextDeliveryDate: subscription.next_delivery_date,
      accountUrl: `${baseUrl}/account?tab=subscriptions`,
      subscribeUrl: `${baseUrl}/subscribe`,
      ...additionalData,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Habesha Coffee <onboarding@resend.dev>",
        to: [profile.email],
        subject: template.subject,
        html: template.getHtml(emailData),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const result = await response.json();
    logStep("Email sent successfully", { emailId: result.id });

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
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
