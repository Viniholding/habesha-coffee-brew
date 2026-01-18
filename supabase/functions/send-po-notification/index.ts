import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-PO-NOTIFICATION] ${step}${detailsStr}`);
};

interface NotificationRequest {
  type: 'items_received' | 'order_overdue';
  purchaseOrderId: string;
  itemsReceived?: Array<{
    productName: string;
    quantityReceived: number;
  }>;
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

    const { type, purchaseOrderId, itemsReceived }: NotificationRequest = await req.json();
    logStep("Notification request", { type, purchaseOrderId });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Get purchase order with supplier
    const { data: order, error: orderError } = await supabaseClient
      .from("purchase_orders")
      .select(`
        *,
        suppliers(name, email, contact_person)
      `)
      .eq("id", purchaseOrderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Purchase order not found: ${orderError?.message}`);
    }

    logStep("Order found", { orderNumber: order.order_number });

    // Get admin users to notify
    const { data: adminUsers, error: adminError } = await supabaseClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .eq("is_active", true);

    if (adminError) {
      logStep("Failed to fetch admins", { error: adminError.message });
    }

    // Get admin emails
    const adminEmails: string[] = [];
    if (adminUsers && adminUsers.length > 0) {
      const { data: profiles } = await supabaseClient
        .from("profiles")
        .select("email")
        .in("id", adminUsers.map(u => u.user_id));
      
      if (profiles) {
        adminEmails.push(...profiles.map(p => p.email).filter(Boolean));
      }
    }

    if (adminEmails.length === 0) {
      logStep("No admin emails found, skipping notification");
      return new Response(JSON.stringify({ success: true, message: "No admins to notify" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Admin emails", { count: adminEmails.length });

    let subject = '';
    let emailHtml = '';
    const supplierName = order.suppliers?.name || 'Unknown Supplier';

    if (type === 'items_received') {
      subject = `✅ Items Received - PO #${order.order_number}`;
      
      const itemsHtml = (itemsReceived || []).map(item => 
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold; color: #16a34a;">+${item.quantityReceived}</td>
        </tr>`
      ).join('');

      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th { background: #f3f4f6; padding: 12px; text-align: left; }
            .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📦 Items Received</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Purchase Order #${order.order_number}</p>
            </div>
            <div class="content">
              <div class="info-box">
                <p style="margin: 0;"><strong>Supplier:</strong> ${supplierName}</p>
                <p style="margin: 5px 0 0;"><strong>Received at:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <h3>Items Received:</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style="text-align: center;">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <p style="color: #666;">Inventory has been automatically updated.</p>
            </div>
            <div class="footer">
              <p>Habesha Coffee Co. - Purchase Order Management</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'order_overdue') {
      const daysOverdue = order.expected_delivery_date 
        ? Math.floor((Date.now() - new Date(order.expected_delivery_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      subject = `⚠️ Overdue PO #${order.order_number} - ${daysOverdue} days late`;
      
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .warning-box { background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">⚠️ Overdue Purchase Order</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Requires Attention</p>
            </div>
            <div class="content">
              <div class="warning-box">
                <h2 style="margin: 0 0 15px; color: #dc2626;">PO #${order.order_number} is ${daysOverdue} days overdue</h2>
                <p style="margin: 0; color: #666;">Expected delivery was ${order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'not set'}.</p>
              </div>
              
              <h3>Order Details:</h3>
              <div style="background: #f9fafb; border-radius: 8px; padding: 15px;">
                <div class="info-row">
                  <span>Supplier</span>
                  <strong>${supplierName}</strong>
                </div>
                <div class="info-row">
                  <span>Total Amount</span>
                  <strong>$${order.total_amount?.toFixed(2) || '0.00'}</strong>
                </div>
                <div class="info-row">
                  <span>Status</span>
                  <strong>${order.status}</strong>
                </div>
              </div>
              
              <p style="margin-top: 20px; color: #666;">
                Please contact the supplier to check on the delivery status, or update the expected delivery date in the admin panel.
              </p>
              
              ${order.suppliers?.email ? `<p><strong>Supplier Contact:</strong> ${order.suppliers.email}</p>` : ''}
            </div>
            <div class="footer">
              <p>Habesha Coffee Co. - Purchase Order Management</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Send email
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Habesha Coffee <onboarding@resend.dev>",
        to: adminEmails,
        subject: subject,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const result = await response.json();
    logStep("Email sent successfully", { emailId: result.id, recipients: adminEmails.length });

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
