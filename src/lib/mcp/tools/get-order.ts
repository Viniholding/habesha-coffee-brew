import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_order",
  title: "Get order details",
  description: "Get one of the signed-in customer's orders, including line items and shipment tracking.",
  inputSchema: {
    order_number: z.string().trim().min(1).describe("The order number, as shown in order history."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_number }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, status, subtotal, tax, shipping, total, carrier, tracking_number, tracking_url, shipped_at, delivered_at, estimated_delivery_date, created_at")
      .eq("order_number", order_number)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!order) throw new ToolError(`No order found with number ${order_number}`);

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("product_name, quantity, unit_price, total_price")
      .eq("order_id", order.id);
    if (itemsError) return { content: [{ type: "text", text: itemsError.message }], isError: true };

    const payload = { ...order, items: items ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: { order: payload },
    };
  },
});
