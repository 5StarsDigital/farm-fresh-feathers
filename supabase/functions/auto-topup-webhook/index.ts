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
    // Parse webhook payload from Web2M
    const payload = await req.json();
    
    console.log('Auto top-up webhook received:', payload);

    // Create Supabase service client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { description, amount, status } = payload;

    // Only process successful transactions
    if (status !== 'success' && status !== 'completed') {
      console.log('Transaction not successful, skipping...');
      return new Response(
        JSON.stringify({ message: 'Transaction not successful' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Check if description matches the pattern "chicken[NUMBER]"
    const chickensMatch = description?.match(/^chicken(\d+)$/i);
    
    if (!chickensMatch) {
      console.log('Description does not match chicken pattern:', description);
      return new Response(
        JSON.stringify({ error: 'Invalid description format' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const userNumericId = parseInt(chickensMatch[1]);
    console.log('Extracted user numeric ID:', userNumericId);

    // Find user by numeric_id in profiles table
    const { data: userProfile, error: userError } = await supabaseService
      .from('profiles')
      .select('id, email, full_name')
      .eq('numeric_id', userNumericId)
      .single();

    if (userError || !userProfile) {
      console.error('User not found with numeric ID:', userNumericId);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    const userId = userProfile.id;

    // Get or create user's farm
    let { data: farm, error: farmError } = await supabaseService
      .from('farms')
      .select('id, account_balance')
      .eq('user_id', userId)
      .single();

    if (farmError && farmError.code === 'PGRST116') {
      // Farm doesn't exist, create one
      const { data: newFarm, error: createError } = await supabaseService
        .from('farms')
        .insert({
          user_id: userId,
          farm_name: 'Trang trại của tôi',
          account_balance: 0
        })
        .select('id, account_balance')
        .single();

      if (createError) {
        console.error('Error creating farm:', createError);
        throw new Error('Failed to create farm');
      }

      farm = newFarm;
    } else if (farmError) {
      console.error('Error fetching farm:', farmError);
      throw new Error('Failed to fetch farm');
    }

    const currentBalance = farm?.account_balance || 0;
    const newBalance = Number(currentBalance) + Number(amount);

    // Update farm balance
    const { error: updateError } = await supabaseService
      .from('farms')
      .update({
        account_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating farm balance:', updateError);
      throw new Error('Failed to update farm balance');
    }

    // Record transaction
    const { error: transactionError } = await supabaseService
      .from('transactions')
      .insert({
        farm_id: farm.id,
        transaction_type: 'deposit',
        amount: Number(amount),
        description: `Nạp tiền tự động qua chuyển khoản - ${description}`,
        user_email: userProfile.email || '',
        user_name: userProfile.full_name || ''
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      // Don't throw error here as the balance was already updated
    }

    console.log('Auto top-up completed successfully:', {
      user_id: userId,
      amount: amount,
      new_balance: newBalance,
      description: description
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Balance updated successfully',
        user_id: userId,
        amount: amount,
        new_balance: newBalance
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Auto top-up webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});