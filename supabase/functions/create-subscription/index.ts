import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getClientId, checkRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { serviceClient } from "../_shared/auth.ts";

// Server-side pricing constants (never trust client-supplied amounts)
const BAG_SIZE_MULTIPLIERS: Record<string, number> = { "12oz": 1, "2lb": 2.5, "5lb": 5.5 };
const PREPAID_DISCOUNTS: Record<string, number> = { "3": 5, "6": 10, "12": 15 };
const FREQUENCY_DAYS: Record<string, number> = { weekly: 7, biweekly: 14, every_3_weeks: 21, every_4_weeks: 28, monthly: 30 };
const BASE_SUBSCRIBER_DISCOUNT = 10;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientId = getClientId(req);
  const rateLimitResponse = checkRateLimit(clientId, RATE_LIMITS.checkout, corsHeaders);
  if (rateLimitResponse) {
    logStep("Rate limited", { clientId });
    return rateLimitResponse;
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { 
      priceId, 
      productId, 
      productName,
      internalProductId,
      quantity, 
      frequency, 
      grind, 
      bagSize,
      firstDeliveryDate,
      couponCode,
      discountCode,
      discountPercent,
      subscriptionType,
      // Prepaid fields
      isPrepaid,
      prepaidMonths,
      prepaidTotal,
      // Gift fields
      isGift,
      giftRecipientName,
      giftRecipientEmail,
      giftMessage,
      giftDuration,
    } = await req.json();
    
    logStep("Request body", { 
      priceId, productId, productName, internalProductId, quantity, frequency, 
      subscriptionType, isPrepaid, isGift, firstDeliveryDate 
    });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // ---- Server-side price computation (client-supplied priceId/prepaidTotal are ignored) ----
    const admin = serviceClient();
    if (!internalProductId) throw new Error("internalProductId is required");

    const { data: productRow, error: productError } = await admin
      .from("products")
      .select("id, price, in_stock")
      .eq("id", internalProductId)
      .maybeSingle();

    if (productError || !productRow) throw new Error("Product not found");
    if (productRow.in_stock === false) throw new Error("Product is not available");

    const safeQuantity = Math.min(Math.max(parseInt(String(quantity ?? 1), 10) || 1, 1), 20);
    const bagMultiplier = BAG_SIZE_MULTIPLIERS[String(bagSize ?? "12oz")];
    if (!bagMultiplier) throw new Error("Invalid bag size");

    const basePrice = Number(productRow.price) * bagMultiplier * safeQuantity;

    let serverDiscountPercent = BASE_SUBSCRIBER_DISCOUNT;
    let totalDeliveries = 1;
    const daysPerDelivery = FREQUENCY_DAYS[String(frequency)] ?? 14;

    if (isPrepaid) {
      const months = parseInt(String(prepaidMonths ?? 0), 10) || 0;
      const prepaidDiscount = PREPAID_DISCOUNTS[String(months)];
      if (!prepaidDiscount) throw new Error("Invalid prepaid duration");
      serverDiscountPercent += prepaidDiscount;
      totalDeliveries = Math.max(1, Math.floor((months * 30) / daysPerDelivery));
    } else if (isGift) {
      const months = parseInt(String(giftDuration ?? 0), 10) || 0;
      if (months < 1 || months > 12) throw new Error("Invalid gift duration");
      totalDeliveries = Math.max(1, Math.floor((months * 30) / daysPerDelivery));
    }

    // Validate any coupon server-side instead of trusting discountPercent
    const submittedCoupon = (couponCode || discountCode || "").toString().trim().toUpperCase();
    let validatedCouponCode = "";
    let validatedCouponPercent = 0;
    if (submittedCoupon) {
      if (!/^[A-Z0-9_-]{1,32}$/.test(submittedCoupon)) throw new Error("Invalid coupon code");
      const { data: promoRows } = await admin.rpc("validate_promotion_code", {
        _code: submittedCoupon,
        _user_id: user.id,
        _is_subscription: true,
      });
      const promo = Array.isArray(promoRows) ? promoRows[0] : promoRows;
      if (promo?.is_valid && promo.discount_type === "percentage") {
        validatedCouponPercent = Number(promo.discount_value) || 0;
        validatedCouponCode = submittedCoupon;
        serverDiscountPercent += validatedCouponPercent;
      }
    }

    serverDiscountPercent = Math.min(Math.max(serverDiscountPercent, 0), 90);
    const perDeliveryPrice = basePrice * (1 - serverDiscountPercent / 100);
    const serverTotalAmount = perDeliveryPrice * totalDeliveries;

    logStep("Server-computed pricing", {
      basePrice, serverDiscountPercent, perDeliveryPrice, totalDeliveries, serverTotalAmount,
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Map frequency to Stripe interval
    const frequencyMap: Record<string, { interval: "day" | "week" | "month"; interval_count: number }> = {
      "weekly": { interval: "week", interval_count: 1 },
      "biweekly": { interval: "week", interval_count: 2 },
      "monthly": { interval: "month", interval_count: 1 },
      "every_3_weeks": { interval: "week", interval_count: 3 },
      "every_4_weeks": { interval: "week", interval_count: 4 },
    };

    const intervalConfig = frequencyMap[frequency] || { interval: "week", interval_count: 2 };
    const origin = req.headers.get("origin") || "https://localhost:3000";

    // Handle different subscription types
    if (isPrepaid || isGift) {
      // For prepaid and gift, we create a one-time payment
      const totalAmount = serverTotalAmount * 100;
      
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product: productId,
              unit_amount: Math.round(totalAmount),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/account?tab=subscriptions&success=true`,
        cancel_url: `${origin}/subscribe?canceled=true`,
        metadata: {
          user_id: user.id,
          product_id: productId,
          internal_product_id: internalProductId || "",
          product_name: productName,
          grind: grind || "whole_bean",
          bag_size: bagSize || "12oz",
          frequency: frequency,
          quantity: String(safeQuantity),
          first_delivery_date: firstDeliveryDate || "",
          is_prepaid: String(isPrepaid || false),
          prepaid_months: String(prepaidMonths || 0),
          is_gift: String(isGift || false),
          gift_recipient_name: giftRecipientName || "",
          gift_recipient_email: giftRecipientEmail || "",
          gift_message: giftMessage || "",
          gift_duration: String(giftDuration || 0),
          discount_code: discountCode || "",
          discount_percent: String(serverDiscountPercent),
        },
      };

      const session = await stripe.checkout.sessions.create(sessionParams);
      logStep("Prepaid/Gift checkout session created", { sessionId: session.id });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Regular subscription
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product: productId,
            unit_amount: Math.round(perDeliveryPrice * 100),
            recurring: intervalConfig,
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/account?tab=subscriptions&success=true`,
      cancel_url: `${origin}/subscribe?canceled=true`,
      metadata: {
        user_id: user.id,
        product_id: productId,
        internal_product_id: internalProductId || "",
        product_name: productName,
        grind: grind || "whole_bean",
        bag_size: bagSize || "12oz",
        frequency: frequency,
        quantity: String(safeQuantity),
        first_delivery_date: firstDeliveryDate || "",
        discount_code: validatedCouponCode,
        discount_percent: String(serverDiscountPercent),
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          product_id: productId,
          internal_product_id: internalProductId || "",
          product_name: productName,
          grind: grind || "whole_bean",
          bag_size: bagSize || "12oz",
          frequency: frequency,
          first_delivery_date: firstDeliveryDate || "",
        },
      },
    };

    // Apply coupon if provided
    if (couponCode) {
      try {
        const coupons = await stripe.coupons.list({ limit: 100 });
        type StripeCoupon = { id: string; name?: string | null };
        const coupon = coupons.data.find((c: StripeCoupon) => c.name?.toLowerCase() === couponCode.toLowerCase() || c.id === couponCode);
        if (coupon) {
          sessionParams.discounts = [{ coupon: coupon.id }];
          logStep("Coupon applied", { couponId: coupon.id });
        }
      } catch (e) {
        logStep("Coupon lookup failed", { error: e });
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
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
