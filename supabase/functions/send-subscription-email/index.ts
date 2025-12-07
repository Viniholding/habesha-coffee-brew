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
  | "payment_failed"
  | "renewal_reminder"
  | "low_stock_notification"
  | "payment_receipt"
  | "gift_subscription_sent";

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
  renewal_reminder: {
    subject: "Your Coffee Delivery is Coming Up!",
    getHtml: (data) => `
      <h1>Delivery Reminder</h1>
      <p>Hi ${data.firstName || "there"},</p>
      <p>Your next ${data.productName} delivery is scheduled for <strong>${data.deliveryDate}</strong>.</p>
      <h3>Order Details:</h3>
      <ul>
        <li><strong>Product:</strong> ${data.productName}</li>
        <li><strong>Quantity:</strong> ${data.quantity}</li>
        <li><strong>Amount:</strong> $${data.amount}</li>
      </ul>
      <p>Want to make changes? <a href="${data.accountUrl}">Manage your subscription</a></p>
      <p>Need to skip this delivery? You can do that from your account page.</p>
    `,
  },
  low_stock_notification: {
    subject: "Low Stock Alert - Subscription Product",
    getHtml: (data) => `
      <h1>Low Stock Alert</h1>
      <p>The following product is running low:</p>
      <ul>
        <li><strong>Product:</strong> ${data.productName}</li>
        <li><strong>Current Stock:</strong> ${data.currentStock}</li>
        <li><strong>Active Subscriptions:</strong> ${data.activeSubscriptions}</li>
      </ul>
      <p>Please restock soon to avoid subscription fulfillment delays.</p>
    `,
  },
  payment_receipt: {
    subject: "Payment Receipt - Habesha Coffee Subscription",
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #2d1810 0%, #4a2c1d 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 30px; }
          .receipt-box { background: #faf8f5; border: 1px solid #e8e4df; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .line-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e8e4df; }
          .line-item:last-child { border-bottom: none; font-weight: bold; font-size: 18px; }
          .footer { background: #faf8f5; padding: 20px 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Payment Receipt</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Thank you for your subscription!</p>
          </div>
          <div class="content">
            <p>Hi ${data.firstName || "there"},</p>
            <p>Your payment has been successfully processed. Here's your receipt:</p>
            
            <div class="receipt-box">
              <h3 style="margin-top: 0;">Order Details</h3>
              <div class="line-item">
                <span>Receipt #</span>
                <span>${data.receiptNumber || data.subscriptionId?.substring(0, 8).toUpperCase()}</span>
              </div>
              <div class="line-item">
                <span>Date</span>
                <span>${data.paymentDate || new Date().toLocaleDateString()}</span>
              </div>
              <div class="line-item">
                <span>${data.productName} (${data.quantity}x ${data.bagSize})</span>
                <span>$${data.subtotal}</span>
              </div>
              ${data.discountAmount > 0 ? `
              <div class="line-item" style="color: #22c55e;">
                <span>Discount (${data.discountCode || 'Subscriber'})</span>
                <span>-$${data.discountAmount}</span>
              </div>
              ` : ''}
              <div class="line-item">
                <span>Shipping</span>
                <span>${data.shipping || 'FREE'}</span>
              </div>
              <div class="line-item">
                <span>Total Charged</span>
                <span>$${data.total}</span>
              </div>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Next scheduled delivery: <strong>${data.nextDeliveryDate}</strong>
            </p>
            
            <p>
              <a href="${data.accountUrl}" style="display: inline-block; background: #4a2c1d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Manage Subscription
              </a>
            </p>
          </div>
          <div class="footer">
            <p>Habesha Coffee Co. | Premium Ethiopian Coffee</p>
            <p>Questions? Reply to this email or visit our website.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
  gift_subscription_sent: {
    subject: "You've Received a Coffee Gift! 🎁",
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 30px; }
          .gift-box { background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border: 2px solid #f9a8d4; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
          .message { background: #faf8f5; border-left: 4px solid #ec4899; padding: 15px; margin: 20px 0; font-style: italic; }
          .footer { background: #faf8f5; padding: 20px 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">🎁 You've Been Gifted!</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Premium Ethiopian Coffee, delivered to your door</p>
          </div>
          <div class="content">
            <p>Hi ${data.giftRecipientName || "there"},</p>
            <p><strong>${data.senderName || "Someone special"}</strong> has gifted you a Habesha Coffee subscription!</p>
            
            <div class="gift-box">
              <h2 style="margin-top: 0; color: #be185d;">${data.productName}</h2>
              <p style="font-size: 18px; margin: 10px 0;">${data.giftDuration} months of premium coffee</p>
              <p style="color: #666; margin: 0;">${data.quantity}x ${data.bagSize} bags, ${data.frequency} delivery</p>
            </div>
            
            ${data.giftMessage ? `
            <div class="message">
              <p style="margin: 0;">"${data.giftMessage}"</p>
              <p style="margin: 10px 0 0; text-align: right;">— ${data.senderName || "Your friend"}</p>
            </div>
            ` : ''}
            
            <p>Your first delivery will arrive on <strong>${data.nextDeliveryDate}</strong>!</p>
            
            <p>To manage your gift subscription and track deliveries, create a free account:</p>
            
            <p>
              <a href="${data.signupUrl}" style="display: inline-block; background: #ec4899; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Activate Your Gift
              </a>
            </p>
          </div>
          <div class="footer">
            <p>Habesha Coffee Co. | Premium Ethiopian Coffee</p>
            <p>Ethically sourced, freshly roasted, delivered with care.</p>
          </div>
        </div>
      </body>
      </html>
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
      signupUrl: `${baseUrl}/auth`,
      quantity: subscription.quantity,
      giftDuration: subscription.prepaid_months || additionalData?.giftDuration,
      giftRecipientName: subscription.gift_recipient_name || additionalData?.giftRecipientName,
      giftMessage: subscription.gift_message || additionalData?.giftMessage,
      senderName: profile.first_name || additionalData?.senderName,
      ...additionalData,
    };

    // Determine recipient email
    let recipientEmail = profile.email;
    
    // For gift subscription notification, send to the gift recipient
    if (type === "gift_subscription_sent" && subscription.gift_recipient_email) {
      recipientEmail = subscription.gift_recipient_email;
      logStep("Sending gift notification to recipient", { recipientEmail });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Habesha Coffee <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: template.subject,
        html: template.getHtml(emailData),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const result = await response.json();
    logStep("Email sent successfully", { emailId: result.id, to: recipientEmail });

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
