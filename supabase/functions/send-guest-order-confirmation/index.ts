import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getClientId, checkRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GUEST-ORDER-CONFIRMATION] ${step}${detailsStr}`);
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface GuestOrderRequest {
  email: string;
  firstName: string;
  lastName: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientId = getClientId(req);
  const rateLimitResponse = checkRateLimit(clientId, RATE_LIMITS.email, corsHeaders);
  if (rateLimitResponse) {
    logStep("Rate limited", { clientId });
    return rateLimitResponse;
  }

  try {
    logStep("Function started");

    const request: GuestOrderRequest = await req.json();
    logStep("Order confirmation request", { 
      email: request.email, 
      orderNumber: request.orderNumber,
      itemCount: request.items.length 
    });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "";

    const itemsHtml = request.items.map(item => 
      `<tr>
        <td style="padding: 12px; border-bottom: 1px solid #e8e4df;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span>${item.name}</span>
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e8e4df; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e8e4df; text-align: right;">$${item.price.toFixed(2)}</td>
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
          .order-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
          .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .order-table th { background: #faf8f5; padding: 12px; text-align: left; border-bottom: 2px solid #e8e4df; }
          .address-box { background: #faf8f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #faf8f5; padding: 20px 30px; text-align: center; font-size: 12px; color: #666; }
          .btn { display: inline-block; background: #4a2c1d; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 5px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .totals-row.total { font-size: 18px; font-weight: bold; border-top: 2px solid #e8e4df; padding-top: 12px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">☕ Order Confirmed!</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Thank you for your purchase</p>
          </div>
          <div class="content">
            <p>Hi ${request.firstName},</p>
            <p>Thank you for your order! We're excited to get your premium Ethiopian coffee on its way to you.</p>
            
            <div class="order-box">
              <h2 style="margin-top: 0; color: #b45309;">Order #${request.orderNumber}</h2>
              <p style="margin: 0; color: #92400e;">We'll send you a shipping confirmation with tracking information once your order ships.</p>
            </div>
            
            <h3>Order Details</h3>
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
            
            <div style="max-width: 300px; margin-left: auto;">
              <div class="totals-row">
                <span>Subtotal</span>
                <span>$${request.subtotal.toFixed(2)}</span>
              </div>
              <div class="totals-row">
                <span>Shipping</span>
                <span>${request.shipping === 0 ? 'Free' : '$' + request.shipping.toFixed(2)}</span>
              </div>
              <div class="totals-row total">
                <span>Total</span>
                <span style="color: #4a2c1d;">$${request.total.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="address-box">
              <h4 style="margin-top: 0;">Shipping To:</h4>
              <p style="margin: 0;">
                ${request.shippingAddress.fullName}<br>
                ${request.shippingAddress.addressLine1}<br>
                ${request.shippingAddress.addressLine2 ? request.shippingAddress.addressLine2 + '<br>' : ''}
                ${request.shippingAddress.city}, ${request.shippingAddress.state} ${request.shippingAddress.postalCode}<br>
                ${request.shippingAddress.country}
              </p>
            </div>
            
            <p style="margin-top: 30px; text-align: center;">
              <a href="${baseUrl}/products" class="btn">
                Continue Shopping
              </a>
            </p>
            
            <p style="text-align: center; color: #666; font-size: 14px; margin-top: 20px;">
              Want to track your orders and earn rewards?<br>
              <a href="${baseUrl}/auth?mode=signup" style="color: #4a2c1d;">Create an account</a>
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
        to: [request.email],
        subject: `Order Confirmed! #${request.orderNumber} ☕`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const result = await response.json();
    logStep("Email sent successfully", { emailId: result.id, to: request.email });

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
