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
    const { chickenTypeId, quantity = 1 } = await req.json();

    if (!chickenTypeId) {
      throw new Error('Chicken type ID is required');
    }

    // Create Supabase service client for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get chicken type details
    const { data: chickenType, error: chickenError } = await supabaseService
      .from('chicken_types')
      .select('*')
      .eq('id', chickenTypeId)
      .single();

    if (chickenError || !chickenType) {
      throw new Error('Chicken type not found');
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
    const totalCost = Number(chickenType.price) * quantity;

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

    // 2. Add chickens to user's farm or update existing
    const { data: existingChicken } = await supabaseService
      .from('user_chickens')
      .select('*')
      .eq('farm_id', userFarm.id)
      .eq('chicken_type_id', chickenTypeId)
      .single();

    if (existingChicken) {
      // Update existing chicken quantity
      const { error: updateError } = await supabaseService
        .from('user_chickens')
        .update({ 
          quantity: existingChicken.quantity + quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingChicken.id);

      if (updateError) {
        console.error('Error updating chickens:', updateError);
        throw new Error('Failed to update chickens');
      }
    } else {
      // Create new chicken record
      const { error: insertError } = await supabaseService
        .from('user_chickens')
        .insert({
          farm_id: userFarm.id,
          chicken_type_id: chickenTypeId,
          quantity: quantity,
          last_egg_collection: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error adding chickens:', insertError);
        
        // Rollback balance update
        await supabaseService
          .from('farms')
          .update({ 
            account_balance: currentBalance 
          })
          .eq('user_id', user.id);
        
        throw new Error('Failed to add chickens');
      }
    }

    // 3. Add transaction record
    await supabaseService
      .from('transactions')
      .insert({
        farm_id: userFarm.id,
        transaction_type: 'chicken_rental',
        amount: -totalCost,
        quantity: quantity,
        description: `Thuê gà ${chickenType.name} (${quantity} con)`,
        created_at: new Date().toISOString()
      });

    console.log('Chicken rental successful:', {
      user_id: user.id,
      chicken_name: chickenType.name,
      quantity: quantity,
      total_cost: totalCost,
      new_balance: currentBalance - totalCost
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Chickens rented successfully',
        new_balance: currentBalance - totalCost,
        chicken_name: chickenType.name,
        quantity: quantity
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Chicken rental error:', error);
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