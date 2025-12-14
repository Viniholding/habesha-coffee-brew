import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ErrorLog {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  url?: string;
  userAgent?: string;
  timestamp?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const errorData: ErrorLog = await req.json();
    
    // Log to console for now (can be extended to store in database or send to external service)
    console.error("[Client Error]", {
      message: errorData.message,
      stack: errorData.stack,
      context: errorData.context,
      url: errorData.url,
      userAgent: errorData.userAgent,
      timestamp: errorData.timestamp || new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[log-error] Failed to process error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to log error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
