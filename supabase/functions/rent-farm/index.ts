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
    const { availableFarmId } = await req.json();

    if (!availableFarmId) {
      throw new Error('Farm ID is required');
    }

    // Create Supabase service client for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get farm details
    const { data: availableFarm, error: farmError } = await supabaseService
      .from('available_farms')
      .select('*')
      .eq('id', availableFarmId)
      .single();

    if (farmError || !availableFarm) {
      throw new Error('Farm not found');
    }

    if (availableFarm.available_coops <= 0) {
      throw new Error('No available coops in this farm');
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
    const rentalCost = Number(availableFarm.rental_price);

    if (currentBalance < rentalCost) {
      throw new Error('Insufficient balance');
    }

    // Start transaction
    // 1. Deduct money from user's account
    const { error: balanceError } = await supabaseService
      .from('farms')
      .update({ 
        account_balance: currentBalance - rentalCost 
      })
      .eq('user_id', user.id);

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      throw new Error('Failed to update account balance');
    }

    // 2. Create farm rental record
    const { error: rentalError } = await supabaseService
      .from('farm_rentals')
      .insert({
        user_id: user.id,
        farm_id: userFarm.id,
        available_farm_id: availableFarmId,
        rental_price: rentalCost,
        monthly_cost: availableFarm.monthly_cost,
        status: 'active'
      });

    if (rentalError) {
      console.error('Error creating rental:', rentalError);
      
      // Rollback balance update
      await supabaseService
        .from('farms')
        .update({ 
          account_balance: currentBalance 
        })
        .eq('user_id', user.id);
      
      throw new Error('Failed to create farm rental');
    }

    // 3. Decrease available coops
    const { error: updateFarmError } = await supabaseService
      .from('available_farms')
      .update({ 
        available_coops: availableFarm.available_coops - 1 
      })
      .eq('id', availableFarmId);

    if (updateFarmError) {
      console.error('Error updating farm availability:', updateFarmError);
      // Note: In a real application, you'd want to rollback all changes here
    }

    // 4. Add transaction record
    await supabaseService
      .from('transactions')
      .insert({
        farm_id: userFarm.id,
        transaction_type: 'farm_rental',
        amount: -rentalCost,
        description: `Thuê trang trại: ${availableFarm.name}`,
        created_at: new Date().toISOString()
      });

    console.log('Farm rental successful:', {
      user_id: user.id,
      farm_name: availableFarm.name,
      rental_price: rentalCost,
      new_balance: currentBalance - rentalCost
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Farm rented successfully',
        new_balance: currentBalance - rentalCost,
        farm_name: availableFarm.name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Farm rental error:', error);
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