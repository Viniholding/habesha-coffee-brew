import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[WEEKLY-FRAUD-SUMMARY] ${step}`, details ? JSON.stringify(details) : '');
};

interface FraudCluster {
  primaryUserId: string;
  primaryEmail: string;
  linkedAccounts: number;
  totalRiskScore: number;
  isRestricted: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    logStep("Starting weekly fraud summary generation");

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get all account restrictions
    const { data: restrictions, error: restrictionsError } = await supabase
      .from('account_restrictions')
      .select('*');

    if (restrictionsError) throw restrictionsError;

    // Get profiles for enrichment
    const userIds = restrictions?.map(r => r.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .in('id', userIds);

    const profilesMap: Record<string, any> = {};
    profiles?.forEach(p => { profilesMap[p.id] = p; });

    // Get payment methods for cross-account detection
    const { data: paymentMethods } = await supabase
      .from('payment_methods')
      .select('user_id, card_last_four, card_brand')
      .in('user_id', userIds);

    // Get addresses for cross-account detection
    const { data: addresses } = await supabase
      .from('addresses')
      .select('user_id, address_line1, postal_code')
      .in('user_id', userIds);

    // Detect fraud clusters
    const clusters: FraudCluster[] = [];
    const processedUsers = new Set<string>();

    // Build payment method map
    const cardMap: Record<string, string[]> = {};
    paymentMethods?.forEach(pm => {
      if (pm.card_last_four && pm.card_brand) {
        const key = `${pm.card_brand}-${pm.card_last_four}`;
        if (!cardMap[key]) cardMap[key] = [];
        if (!cardMap[key].includes(pm.user_id)) cardMap[key].push(pm.user_id);
      }
    });

    // Build address map
    const addressMap: Record<string, string[]> = {};
    addresses?.forEach(addr => {
      if (addr.address_line1 && addr.postal_code) {
        const key = `${addr.address_line1.toLowerCase().trim()}-${addr.postal_code}`;
        if (!addressMap[key]) addressMap[key] = [];
        if (!addressMap[key].includes(addr.user_id)) addressMap[key].push(addr.user_id);
      }
    });

    // Find clusters
    restrictions?.forEach(restriction => {
      if (processedUsers.has(restriction.user_id)) return;

      const linkedUsers = new Set<string>();
      
      // Check payment methods
      Object.values(cardMap).forEach(users => {
        if (users.includes(restriction.user_id) && users.length > 1) {
          users.forEach(u => linkedUsers.add(u));
        }
      });

      // Check addresses
      Object.values(addressMap).forEach(users => {
        if (users.includes(restriction.user_id) && users.length > 1) {
          users.forEach(u => linkedUsers.add(u));
        }
      });

      linkedUsers.delete(restriction.user_id);

      if (linkedUsers.size > 0) {
        const clusterRestrictions = restrictions.filter(r => 
          linkedUsers.has(r.user_id) || r.user_id === restriction.user_id
        );
        const totalRiskScore = clusterRestrictions.reduce((sum, r) => sum + r.abuse_score, 0);

        clusters.push({
          primaryUserId: restriction.user_id,
          primaryEmail: profilesMap[restriction.user_id]?.email || 'Unknown',
          linkedAccounts: linkedUsers.size,
          totalRiskScore,
          isRestricted: restriction.is_promotional_restricted,
        });

        linkedUsers.forEach(u => processedUsers.add(u));
        processedUsers.add(restriction.user_id);
      }
    });

    // Calculate weekly stats
    const newRestrictionsThisWeek = restrictions?.filter(r => 
      r.restricted_at && new Date(r.restricted_at) >= oneWeekAgo
    ).length || 0;

    const cooldownExpirations = restrictions?.filter(r => {
      if (!r.restricted_at || !r.is_promotional_restricted) return false;
      const restrictedDate = new Date(r.restricted_at);
      const cooldownEnd = new Date(restrictedDate);
      cooldownEnd.setDate(cooldownEnd.getDate() + 30);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return cooldownEnd >= new Date() && cooldownEnd <= nextWeek;
    }).length || 0;

    const highRiskClusters = clusters.filter(c => c.totalRiskScore >= 100);
    const totalRestricted = restrictions?.filter(r => r.is_promotional_restricted).length || 0;
    const highRiskAccounts = restrictions?.filter(r => r.abuse_score >= 75).length || 0;

    // Generate email HTML
    const clusterRows = highRiskClusters.slice(0, 10).map(cluster => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${cluster.primaryEmail}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${cluster.linkedAccounts}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${cluster.totalRiskScore}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          ${cluster.isRestricted ? '🚫 Restricted' : '⚠️ Active'}
        </td>
      </tr>
    `).join('');

    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@example.com";

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6B4423, #8B5E3C); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">📊 Weekly Fraud Summary Report</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Habesha Command Center</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Week Overview</h2>
          <p style="color: #666;">${oneWeekAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}</p>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
              <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${newRestrictionsThisWeek}</div>
              <div style="color: #666; font-size: 14px;">New Restrictions This Week</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #fd7e14;">
              <div style="font-size: 24px; font-weight: bold; color: #fd7e14;">${highRiskClusters.length}</div>
              <div style="color: #666; font-size: 14px;">High-Risk Fraud Clusters</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #6f42c1;">
              <div style="font-size: 24px; font-weight: bold; color: #6f42c1;">${totalRestricted}</div>
              <div style="color: #666; font-size: 14px;">Total Restricted Accounts</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
              <div style="font-size: 24px; font-weight: bold; color: #28a745;">${cooldownExpirations}</div>
              <div style="color: #666; font-size: 14px;">Cooldowns Expiring Next Week</div>
            </div>
          </div>

          ${highRiskClusters.length > 0 ? `
            <h2 style="color: #333; margin-top: 30px;">🚨 High-Risk Fraud Clusters</h2>
            <p style="color: #666;">Clusters with combined risk score ≥ 100</p>
            <table style="width: 100%; border-collapse: collapse; background: white;">
              <thead>
                <tr style="background: #f1f3f5;">
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Primary Account</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Linked Accounts</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Cluster Risk</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${clusterRows}
              </tbody>
            </table>
          ` : `
            <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <h3 style="color: #155724; margin: 0;">✅ No High-Risk Clusters Detected</h3>
              <p style="color: #155724; margin: 5px 0 0 0;">All detected clusters are below the risk threshold.</p>
            </div>
          `}

          <div style="margin-top: 30px; padding: 15px; background: #e7f3ff; border-radius: 8px;">
            <h3 style="color: #0056b3; margin-top: 0;">📋 Summary Statistics</h3>
            <ul style="color: #333; margin: 0; padding-left: 20px;">
              <li>Total accounts being monitored: <strong>${restrictions?.length || 0}</strong></li>
              <li>High-risk accounts (score ≥ 75): <strong>${highRiskAccounts}</strong></li>
              <li>Total fraud clusters detected: <strong>${clusters.length}</strong></li>
              <li>Cross-account patterns found: <strong>${clusters.reduce((sum, c) => sum + c.linkedAccounts, 0)}</strong></li>
            </ul>
          </div>
        </div>

        <div style="background: #333; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="margin: 0; font-size: 12px;">
            This is an automated weekly report from Habesha Command Center.<br>
            Generated: ${new Date().toISOString()}
          </p>
        </div>
      </div>
    `;

    // Send email
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Habesha Coffee <notifications@resend.dev>",
        to: [adminEmail],
        subject: `📊 Weekly Fraud Summary: ${newRestrictionsThisWeek} new restrictions, ${highRiskClusters.length} high-risk clusters`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    logStep("Weekly fraud summary email sent", { 
      newRestrictions: newRestrictionsThisWeek,
      clusters: clusters.length,
      highRiskClusters: highRiskClusters.length 
    });

    return new Response(JSON.stringify({ 
      success: true,
      stats: {
        newRestrictionsThisWeek,
        totalClusters: clusters.length,
        highRiskClusters: highRiskClusters.length,
        cooldownExpirations,
        totalRestricted,
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep("Error generating weekly summary", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
