import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_orders",
  title: "List my orders",
  description: "List the signed-in customer's recent orders with status and totals.",
  inputSchema: {
    status: z.string().trim().optional().describe("Optional order status filter, e.g. 'shipped'."),
    limit: z.number().int().optional().describe("Maximum number of orders to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("orders")
      .select("id, order_number, status, total, carrier, tracking_number, tracking_url, estimated_delivery_date, created_at")
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 10, 1), 50));
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { orders: data ?? [] },
    };
  },
});
