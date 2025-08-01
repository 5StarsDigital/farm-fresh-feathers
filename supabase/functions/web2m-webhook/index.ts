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
    // Parse webhook payload
    const payload = await req.json();
    
    console.log('Web2M webhook received:', payload);

    // Create Supabase service client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { reference_id, status, amount, transaction_id: web2m_transaction_id } = payload;

    if (!reference_id) {
      throw new Error('Missing reference_id in webhook payload');
    }

    // Find the transaction
    const { data: transaction, error: findError } = await supabaseService
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', reference_id)
      .single();

    if (findError || !transaction) {
      console.error('Transaction not found:', reference_id);
      throw new Error('Transaction not found');
    }

    // Update transaction status
    const { error: updateError } = await supabaseService
      .from('payment_transactions')
      .update({
        status: status === 'success' ? 'completed' : 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('transaction_id', reference_id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      throw new Error('Failed to update transaction');
    }

    // If payment successful, update farm balance
    if (status === 'success') {
      const { error: balanceError } = await supabaseService
        .from('farms')
        .update({
          account_balance: supabaseService.raw(`account_balance + ${amount}`),
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.farm_id);

      if (balanceError) {
        console.error('Error updating farm balance:', balanceError);
        throw new Error('Failed to update farm balance');
      }

      console.log('Payment completed successfully:', {
        transaction_id: reference_id,
        amount: amount,
        farm_id: transaction.farm_id
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});