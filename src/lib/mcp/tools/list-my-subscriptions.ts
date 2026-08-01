import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_subscriptions",
  title: "List my coffee subscriptions",
  description: "List the signed-in customer's coffee subscriptions with status, cadence and next delivery date.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("subscriptions")
      .select("id, status, product_name, frequency, quantity, grind, bag_size, price, next_delivery_date, paused_at, resume_at, cancelled_at, created_at")
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { subscriptions: data ?? [] },
    };
  },
});
