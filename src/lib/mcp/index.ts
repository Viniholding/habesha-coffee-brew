import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list-products";
import listMyOrders from "./tools/list-my-orders";
import getOrder from "./tools/get-order";
import listMySubscriptions from "./tools/list-my-subscriptions";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "habesha-coffee-brew",
  title: "habesha-coffee-brew",
  version: "0.1.0",
  instructions:
    "Tools for the Habesha Coffee store. Browse the coffee catalog, and look up the signed-in customer's orders, order tracking and coffee subscriptions.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProducts, listMyOrders, getOrder, listMySubscriptions],
});
