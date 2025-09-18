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
      selectedChickenGenders,
      totalAmount
    } = await req.json();

    console.log('Processing checkout for user:', user.id);
    console.log('Package:', packageId, 'Coop:', coopId, 'Total:', totalAmount);
    console.log('Selected chicken genders:', selectedChickenGenders);

    // Package info mapping
    const packageInfo = {
      'basic': { name: 'Gói Cơ Bản', price: 200000 },
      'advanced': { name: 'Gói Nâng Cao', price: 400000 },
      'vip': { name: 'Gói VIP', price: 800000 }
    };

    // Get the first selected chicken info (for single chicken type per package)
    const selectedChickenEntries = Object.entries(selectedChickens).filter(([_, qty]) => qty > 0);
    if (selectedChickenEntries.length === 0) {
      return new Response(JSON.stringify({ error: 'No chickens selected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const [selectedChickenTypeId, selectedQuantity] = selectedChickenEntries[0];
    
    // Get chicken type info
    const { data: chickenType, error: chickenTypeError } = await supabaseServiceRole
      .from('chicken_types')
      .select('*')
      .eq('id', selectedChickenTypeId)
      .single();

    if (chickenTypeError) {
      console.error('Chicken type error:', chickenTypeError);
      return new Response(JSON.stringify({ error: 'Chicken type not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Start a transaction to ensure all operations succeed or fail together
    const { error: txError } = await supabaseServiceRole.rpc('execute_checkout_transaction', {
      p_user_id: user.id,
      p_farm_id: farm.id,
      p_package_id: packageId,
      p_package_name: packageInfo[packageId].name,
      p_package_price: packageInfo[packageId].price,
      p_selected_chicken_type_id: selectedChickenTypeId,
      p_selected_chicken_type_name: chickenType.name,
      p_selected_chicken_quantity: parseInt(selectedQuantity as string),
      p_total_amount: totalAmount,
      p_coop_id: coopId || null,
      p_selected_chickens: selectedChickens
    });

    if (txError) {
      console.error('Checkout transaction error:', txError);
      return new Response(JSON.stringify({ 
        error: 'Checkout failed: ' + (txError.message || 'Unknown error')
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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