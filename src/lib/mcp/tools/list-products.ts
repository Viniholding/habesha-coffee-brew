import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_products",
  title: "List coffee products",
  description: "Browse the Habesha coffee catalog, optionally filtered by category or search text.",
  inputSchema: {
    search: z.string().trim().optional().describe("Text to match against product names."),
    category: z.string().trim().optional().describe("Category filter, e.g. 'Single Origin'."),
    limit: z.number().int().optional().describe("Maximum number of products to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("products")
      .select("id, name, description, price, category, in_stock, stock_quantity")
      .order("display_order", { ascending: true })
      .limit(Math.min(Math.max(limit ?? 20, 1), 50));
    if (search) query = query.ilike("name", `%${search}%`);
    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
