import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get current user from Authorization header (decode JWT payload)
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      throw new Error('Unauthorized');
    }

    // Base64url decode helper
    const base64urlToBase64 = (str: string) => str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4);
    const parts = token.split('.');
    let userId: string | null = null;
    try {
      const payload = JSON.parse(atob(base64urlToBase64(parts[1] || '')));
      userId = payload?.sub || null;
    } catch (_) {
      userId = null;
    }
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const { imageUrl, designParams, estimatedPrice } = await req.json();

    console.log('Creating quote request for user:', userId);

    // Insert quote request
    const { data: quoteRequest, error: insertError } = await supabaseClient
      .from('coop_quote_requests')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        design_params: designParams,
        estimated_price: estimatedPrice,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting quote request:', insertError);
      throw insertError;
    }

    console.log('Quote request created:', quoteRequest.id);

    // Get user profile for notification
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    // Get Zalo contact info
    const { data: zaloContact } = await supabaseClient
      .from('contact_settings')
      .select('value, label')
      .eq('contact_type', 'zalo')
      .eq('is_active', true)
      .single();

    // Create notification for admins
    const { data: adminRoles } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .in('role', ['admin', 'super_admin']);

    if (adminRoles && adminRoles.length > 0) {
      const notifications = adminRoles.map(admin => ({
        user_id: admin.user_id,
        title: 'Yêu cầu báo giá chuồng gà mới',
        content: `Khách hàng ${profile?.full_name || 'Unknown'} (${profile?.email || 'N/A'}) đã yêu cầu báo giá cho thiết kế chuồng gà AI.`,
        type: 'quote_request',
        send_email: false,
        status: 'sent',
        metadata: {
          quote_request_id: quoteRequest.id,
          user_name: profile?.full_name,
          user_email: profile?.email,
          estimated_price: estimatedPrice
        }
      }));

      await supabaseClient
        .from('notifications')
        .insert(notifications);
    }

    return new Response(
      JSON.stringify({
        success: true,
        quoteRequestId: quoteRequest.id,
        zaloContact: zaloContact?.value || null,
        zaloLabel: zaloContact?.label || 'Liên hệ Zalo',
        message: 'Yêu cầu báo giá đã được gửi thành công!'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in request-coop-quote:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});