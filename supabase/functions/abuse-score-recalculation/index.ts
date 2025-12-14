import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[ABUSE-RECALC] ${step}`, details ? JSON.stringify(details) : '');
};

// Cooldown period in days before auto-lifting restrictions
const COOLDOWN_DAYS = 30;
// Score decay per day for good behavior
const DAILY_SCORE_DECAY = 2;
// Threshold below which restrictions are lifted
const LIFT_RESTRICTION_THRESHOLD = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    logStep("Starting daily abuse score recalculation");

    // Get all account restrictions
    const { data: restrictions, error: fetchError } = await supabase
      .from('account_restrictions')
      .select('*');

    if (fetchError) {
      throw new Error(`Failed to fetch restrictions: ${fetchError.message}`);
    }

    logStep("Fetched restrictions", { count: restrictions?.length || 0 });

    const now = new Date();
    const results = {
      processed: 0,
      scoresDecayed: 0,
      restrictionsLifted: 0,
      errors: 0,
    };

    for (const restriction of restrictions || []) {
      try {
        results.processed++;
        
        const lastCheck = restriction.last_abuse_check_at 
          ? new Date(restriction.last_abuse_check_at) 
          : new Date(restriction.created_at);
        
        const daysSinceLastCheck = Math.floor(
          (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check for recent abuse activity in the last 24 hours
        const { data: recentAuditLogs } = await supabase
          .from('coupon_audit_log')
          .select('id')
          .eq('user_id', restriction.user_id)
          .eq('action', 'rejected')
          .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

        const hasRecentAbuse = (recentAuditLogs?.length || 0) > 0;

        // Calculate new score with decay if no recent abuse
        let newScore = restriction.abuse_score;
        if (!hasRecentAbuse && daysSinceLastCheck >= 1) {
          newScore = Math.max(0, restriction.abuse_score - (DAILY_SCORE_DECAY * daysSinceLastCheck));
          results.scoresDecayed++;
          logStep("Score decayed", { 
            userId: restriction.user_id, 
            oldScore: restriction.abuse_score, 
            newScore,
            daysSinceLastCheck 
          });
        }

        // Check if restriction should be lifted
        const shouldLiftRestriction = 
          restriction.is_promotional_restricted &&
          newScore < LIFT_RESTRICTION_THRESHOLD &&
          restriction.restricted_at;

        const restrictedAt = restriction.restricted_at 
          ? new Date(restriction.restricted_at) 
          : null;
        
        const daysSinceRestriction = restrictedAt 
          ? Math.floor((now.getTime() - restrictedAt.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        const cooldownPassed = daysSinceRestriction >= COOLDOWN_DAYS;

        if (shouldLiftRestriction && cooldownPassed) {
          // Lift the restriction
          await supabase
            .from('account_restrictions')
            .update({
              abuse_score: newScore,
              is_promotional_restricted: false,
              restriction_reason: null,
              restricted_at: null,
              restricted_by: null,
              last_abuse_check_at: now.toISOString(),
              notes: `${restriction.notes || ''}\n[${now.toISOString()}] Auto-lifted after ${COOLDOWN_DAYS}-day cooldown. Score: ${newScore}`.trim(),
            })
            .eq('id', restriction.id);

          // Send notification email
          await supabase.functions.invoke('send-abuse-notification', {
            body: {
              type: 'restriction_lifted',
              userId: restriction.user_id,
              abuseScore: newScore,
            },
          });

          results.restrictionsLifted++;
          logStep("Restriction lifted", { 
            userId: restriction.user_id, 
            newScore,
            daysSinceRestriction 
          });
        } else {
          // Just update the score
          await supabase
            .from('account_restrictions')
            .update({
              abuse_score: newScore,
              last_abuse_check_at: now.toISOString(),
            })
            .eq('id', restriction.id);
        }

      } catch (err: unknown) {
        results.errors++;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logStep("Error processing restriction", { 
          userId: restriction.user_id, 
          error: errorMessage 
        });
      }
    }

    logStep("Recalculation complete", results);

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep("Fatal error", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
