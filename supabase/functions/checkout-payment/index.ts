import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get the session
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      packageId,
      coopId,
      selectedChickens,
      totalAmount
    } = await req.json();

    console.log('Processing checkout for user:', user.id);
    console.log('Package:', packageId, 'Coop:', coopId, 'Total:', totalAmount);

    // Get user's farm
    const { data: farm, error: farmError } = await supabaseServiceRole
      .from('farms')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (farmError) {
      console.error('Farm error:', farmError);
      return new Response(JSON.stringify({ error: 'Farm not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has sufficient balance
    if (farm.account_balance < totalAmount) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deduct money from account
    const { error: balanceError } = await supabaseServiceRole
      .from('farms')
      .update({ account_balance: farm.account_balance - totalAmount })
      .eq('id', farm.id);

    if (balanceError) {
      console.error('Balance update error:', balanceError);
      throw balanceError;
    }

    // Handle farm rental if it's advanced or vip package
    if ((packageId === 'advanced' || packageId === 'vip') && coopId) {
      // Check if coopId is actually an available_farm_id
      const { data: availableFarm, error: farmCheckError } = await supabaseServiceRole
        .from('available_farms')
        .select('*')
        .eq('id', coopId)
        .single();

      if (!farmCheckError && availableFarm) {
        // Create farm rental record
        const { error: rentalError } = await supabaseServiceRole
          .from('farm_rentals')
          .insert({
            user_id: user.id,
            farm_id: farm.id,
            available_farm_id: coopId,
            rental_price: availableFarm.rental_price,
            monthly_cost: availableFarm.monthly_cost,
            status: 'active'
          });

        if (rentalError) {
          console.error('Farm rental error:', rentalError);
          throw rentalError;
        }

        // Decrease available coops
        const { error: farmUpdateError } = await supabaseServiceRole
          .from('available_farms')
          .update({ available_coops: availableFarm.available_coops - 1 })
          .eq('id', coopId);

        if (farmUpdateError) {
          console.error('Farm update error:', farmUpdateError);
          throw farmUpdateError;
        }
      }
    }

    // Add chickens to user's farm
    for (const [chickenTypeId, quantity] of Object.entries(selectedChickens)) {
      if (quantity > 0) {
        // Check if user already has this chicken type
        const { data: existingChicken, error: existingError } = await supabaseServiceRole
          .from('user_chickens')
          .select('*')
          .eq('farm_id', farm.id)
          .eq('chicken_type_id', chickenTypeId)
          .single();

        if (existingError && existingError.code !== 'PGRST116') {
          console.error('Existing chicken check error:', existingError);
          throw existingError;
        }

        if (existingChicken) {
          // Update existing quantity
          const { error: updateError } = await supabaseServiceRole
            .from('user_chickens')
            .update({ quantity: existingChicken.quantity + parseInt(quantity as string) })
            .eq('id', existingChicken.id);

          if (updateError) {
            console.error('Chicken update error:', updateError);
            throw updateError;
          }
        } else {
          // Insert new chicken record
          const { error: insertError } = await supabaseServiceRole
            .from('user_chickens')
            .insert({
              farm_id: farm.id,
              chicken_type_id: chickenTypeId,
              quantity: parseInt(quantity as string)
            });

          if (insertError) {
            console.error('Chicken insert error:', insertError);
            throw insertError;
          }
        }
      }
    }

    // Record transaction
    const { error: transactionError } = await supabaseServiceRole
      .from('transactions')
      .insert({
        farm_id: farm.id,
        transaction_type: 'package_purchase',
        amount: -totalAmount,
        description: `Mua gói ${packageId} - Tổng tiền: ${totalAmount.toLocaleString()} VND`
      });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      throw transactionError;
    }

    console.log('Checkout completed successfully');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});