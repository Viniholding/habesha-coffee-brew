import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-OVERDUE-POS] ${step}${detailsStr}`);
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
    logStep("Checking for overdue purchase orders");

    // Find POs that are overdue (expected_delivery_date is past and status is not received/cancelled)
    const today = new Date().toISOString().split('T')[0];
    
    const { data: overduePOs, error } = await supabaseClient
      .from("purchase_orders")
      .select("id, order_number, expected_delivery_date, status")
      .lt("expected_delivery_date", today)
      .not("status", "in", '("received","cancelled")')
      .not("expected_delivery_date", "is", null);

    if (error) {
      throw new Error(`Failed to fetch overdue POs: ${error.message}`);
    }

    logStep("Found overdue POs", { count: overduePOs?.length || 0 });

    if (!overduePOs || overduePOs.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No overdue purchase orders found" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Send notifications for each overdue PO
    const notificationResults = [];
    const baseUrl = Deno.env.get("SUPABASE_URL") || "";
    
    for (const po of overduePOs) {
      logStep("Sending notification for PO", { orderNumber: po.order_number });
      
      try {
        const response = await fetch(`${baseUrl}/functions/v1/send-po-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            type: 'order_overdue',
            purchaseOrderId: po.id,
          }),
        });

        const result = await response.json();
        notificationResults.push({
          orderId: po.id,
          orderNumber: po.order_number,
          success: response.ok,
          result,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logStep("Failed to send notification", { orderNumber: po.order_number, error: errorMsg });
        notificationResults.push({
          orderId: po.id,
          orderNumber: po.order_number,
          success: false,
          error: errorMsg,
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      overdueCount: overduePOs.length,
      notifications: notificationResults,
    }), {
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
