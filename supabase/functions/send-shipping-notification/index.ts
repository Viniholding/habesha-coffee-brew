import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-SHIPPING-NOTIFICATION] ${step}${detailsStr}`);
};

interface ShippingNotificationRequest {
  orderId: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedDelivery?: string;
}

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

    const { orderId, trackingNumber, trackingUrl, carrier, estimatedDelivery }: ShippingNotificationRequest = await req.json();
    logStep("Shipping notification request", { orderId, carrier, trackingNumber });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Get order with user profile and items
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select(`
        *,
        profiles:user_id(email, first_name, last_name),
        order_items(product_name, quantity, unit_price)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    const profile = order.profiles as any;
    if (!profile?.email) {
      throw new Error("Customer email not found");
    }

    logStep("Order found", { orderNumber: order.order_number, email: profile.email });

    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "";
    const orderItems = order.order_items as any[];

    const itemsHtml = orderItems.map(item => 
      `<tr>
        <td style="padding: 12px; border-bottom: 1px solid #e8e4df;">${item.product_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e8e4df; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e8e4df; text-align: right;">$${item.unit_price.toFixed(2)}</td>
      </tr>`
    ).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #2d1810 0%, #4a2c1d 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 30px; }
          .tracking-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
          .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .order-table th { background: #faf8f5; padding: 12px; text-align: left; border-bottom: 2px solid #e8e4df; }
          .footer { background: #faf8f5; padding: 20px 30px; text-align: center; font-size: 12px; color: #666; }
          .btn { display: inline-block; background: #22c55e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 5px; }
          .btn-secondary { background: #4a2c1d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📦 Your Order Has Shipped!</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Great news! Your coffee is on its way.</p>
          </div>
          <div class="content">
            <p>Hi ${profile.first_name || "there"},</p>
            <p>Your order <strong>#${order.order_number}</strong> has been shipped and is on its way to you!</p>
            
            <div class="tracking-box">
              <h2 style="margin-top: 0; color: #16a34a;">Shipping Details</h2>
              ${carrier ? `<p style="margin: 10px 0;"><strong>Carrier:</strong> ${carrier}</p>` : ''}
              ${trackingNumber ? `<p style="margin: 10px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
              ${estimatedDelivery ? `<p style="margin: 10px 0;"><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ''}
              ${trackingUrl ? `
                <a href="${trackingUrl}" class="btn" target="_blank">
                  Track My Package
                </a>
              ` : ''}
            </div>
            
            <h3>Order Summary</h3>
            <table class="order-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <p style="text-align: right; font-size: 18px; font-weight: bold;">
              Total: $${order.total.toFixed(2)}
            </p>
            
            <p style="margin-top: 30px;">
              <a href="${baseUrl}/account" class="btn btn-secondary">
                View Order Details
              </a>
            </p>
          </div>
          <div class="footer">
            <p>Habesha Coffee Co. | Premium Ethiopian Coffee</p>
            <p>Questions about your order? Reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Habesha Coffee <onboarding@resend.dev>",
        to: [profile.email],
        subject: `Your Order #${order.order_number} Has Shipped! 📦`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const result = await response.json();
    logStep("Email sent successfully", { emailId: result.id, to: profile.email });

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
