import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client for user authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    // Parse request body
    const { amount, description } = await req.json();

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Create Supabase service client for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get user's farm
    const { data: farm } = await supabaseService
      .from('farms')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!farm) {
      throw new Error('User farm not found');
    }

    // Create transaction record
    const transactionId = `web2m_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { error: transactionError } = await supabaseService
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        farm_id: farm.id,
        amount: amount,
        transaction_id: transactionId,
        status: 'pending',
        payment_method: 'web2m'
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      throw new Error('Failed to create transaction record');
    }

    // Call Web2M API
    const web2mResponse = await fetch('https://api.web2m.com/api/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('WEB2M_API_KEY') || ''}`
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'VND',
        description: description || 'Nạp tiền vào tài khoản Nuôi Gà 5.0',
        customer_email: user.email,
        return_url: `${req.headers.get('origin')}/payment-success`,
        cancel_url: `${req.headers.get('origin')}/payment-cancel`,
        webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/web2m-webhook`,
        reference_id: transactionId
      })
    });

    if (!web2mResponse.ok) {
      throw new Error(`Web2M API error: ${web2mResponse.status}`);
    }

    const paymentData = await web2mResponse.json();

    console.log('Payment created:', {
      transaction_id: transactionId,
      amount: amount,
      user_id: user.id,
      web2m_response: paymentData
    });

    return new Response(
      JSON.stringify({
        payment_url: paymentData.payment_url,
        transaction_id: transactionId,
        amount: amount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Payment creation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});