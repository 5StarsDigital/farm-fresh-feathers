import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotificationType = 'balance_change' | 'monthly_billing' | 'package_expiry' | 'custom';

interface SendNotificationsRequest {
  title: string;
  content: string;
  type: NotificationType;
  user_ids: string[];
  send_email?: boolean;
}

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = resendApiKey ? new Resend(resendApiKey) : null;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Must be admin or super_admin
    const { data: roleRows, error: roleError } = await supabaseService
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    if (roleError || !roleRows?.length || !['admin','super_admin'].includes(roleRows[0].role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body: SendNotificationsRequest = await req.json();
    const { title, content, type, user_ids, send_email } = body;

    if (!title || !content || !type || !Array.isArray(user_ids) || user_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Insert notifications first
    const rows = user_ids.map((uid) => ({
      user_id: uid,
      title,
      content,
      type,
      send_email: !!send_email,
      status: send_email ? 'pending' : 'sent',
      sent_at: send_email ? null : new Date().toISOString()
    }));

    const { data: inserted, error: insertError } = await supabaseService
      .from('notifications')
      .insert(rows)
      .select('id,user_id');

    if (insertError) {
      console.error('Insert notifications failed:', insertError);
      return new Response(JSON.stringify({ error: 'Insert failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let emailResults: Array<{ user_id: string; success: boolean; error?: string }> = [];

    if (send_email) {
      if (!resend) {
        console.warn('RESEND_API_KEY is not set. Skipping email sending.');
      } else {
        // Fetch emails for recipients - only necessary fields for security compliance
        const { data: profiles, error: profilesError } = await supabaseService
          .from('profiles')
          .select('id,email,full_name')
          .in('id', user_ids);
        if (profilesError) {
          console.error('Load profiles failed:', profilesError);
        } else {
          for (const p of profiles) {
            try {
              const html = `
                <div style="font-family: Arial, sans-serif; line-height:1.6;">
                  <h2 style="margin:0 0 8px 0;">${title}</h2>
                  <p style="margin:0 0 12px 0;">${content}</p>
                  <p style="color:#888; font-size:12px;">Gửi bởi hệ thống Nuôi Gà 5.0</p>
                </div>
              `;
              const toEmail = p.email;
              if (!toEmail) throw new Error('Recipient has no email');
              const { error: emailError } = await resend.emails.send({
                from: 'Notifications <onboarding@resend.dev>',
                to: [toEmail],
                subject: title,
                html,
              });
              if (emailError) throw emailError;
              emailResults.push({ user_id: p.id, success: true });
            } catch (e: any) {
              console.error('Email send error:', e);
              emailResults.push({ user_id: p.id, success: false, error: e?.message || 'Unknown error' });
            }
          }
        }
      }

      // Update statuses
      if (inserted?.length) {
        for (const row of inserted) {
          const ok = emailResults.find(r => r.user_id === row.user_id)?.success ?? false;
          await supabaseService
            .from('notifications')
            .update({ status: ok ? 'sent' : 'failed', sent_at: ok ? new Date().toISOString() : null })
            .eq('id', row.id);
        }
      }
    }

    return new Response(JSON.stringify({
      inserted: inserted?.length || 0,
      email: send_email ? emailResults : undefined
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('send-notifications error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
