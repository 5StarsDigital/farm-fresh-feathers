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

    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    // Parse request body
    const { accessoryId, quantity = 1 } = await req.json();

    if (!accessoryId) {
      throw new Error('Accessory ID is required');
    }

    // Create Supabase service client for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get accessory details
    const { data: accessory, error: accessoryError } = await supabaseService
      .from('accessories')
      .select('*')
      .eq('id', accessoryId)
      .single();

    if (accessoryError || !accessory) {
      throw new Error('Accessory not found');
    }

    // Get user's farm and account balance
    const { data: userFarm } = await supabaseService
      .from('farms')
      .select('id, account_balance')
      .eq('user_id', user.id)
      .single();

    if (!userFarm) {
      throw new Error('User farm not found');
    }

    const currentBalance = Number(userFarm.account_balance) || 0;
    const totalCost = Number(accessory.price) * quantity;

    if (currentBalance < totalCost) {
      throw new Error('Insufficient balance');
    }

    // Start transaction
    // 1. Deduct money from user's account
    const { error: balanceError } = await supabaseService
      .from('farms')
      .update({ 
        account_balance: currentBalance - totalCost 
      })
      .eq('user_id', user.id);

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      throw new Error('Failed to update account balance');
    }

    // 2. Add accessory to user's farm or update existing
    const { data: existingAccessory } = await supabaseService
      .from('user_accessories')
      .select('*')
      .eq('farm_id', userFarm.id)
      .eq('accessory_id', accessoryId)
      .single();

    if (existingAccessory) {
      // Update existing accessory quantity
      const { error: updateError } = await supabaseService
        .from('user_accessories')
        .update({ 
          quantity: existingAccessory.quantity + quantity
        })
        .eq('id', existingAccessory.id);

      if (updateError) {
        console.error('Error updating accessories:', updateError);
        throw new Error('Failed to update accessories');
      }
    } else {
      // Create new accessory record
      const { error: insertError } = await supabaseService
        .from('user_accessories')
        .insert({
          farm_id: userFarm.id,
          accessory_id: accessoryId,
          quantity: quantity
        });

      if (insertError) {
        console.error('Error adding accessories:', insertError);
        
        // Rollback balance update
        await supabaseService
          .from('farms')
          .update({ 
            account_balance: currentBalance 
          })
          .eq('user_id', user.id);
        
        throw new Error('Failed to add accessories');
      }
    }

    // 3. Add transaction record
    await supabaseService
      .from('transactions')
      .insert({
        farm_id: userFarm.id,
        transaction_type: 'accessory_purchase',
        amount: -totalCost,
        quantity: quantity,
        description: `Mua ${accessory.name} (${quantity} cái)`,
        created_at: new Date().toISOString()
      });

    console.log('Accessory purchase successful:', {
      user_id: user.id,
      accessory_name: accessory.name,
      quantity: quantity,
      total_cost: totalCost,
      new_balance: currentBalance - totalCost
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Accessory purchased successfully',
        new_balance: currentBalance - totalCost,
        accessory_name: accessory.name,
        quantity: quantity
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Accessory purchase error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});