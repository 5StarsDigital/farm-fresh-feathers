import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EggCalculationInput {
  lastEggTime: string;
  leftoverTime: number; // in minutes
  productionTimePerEgg: number; // in minutes
  quantity: number;
  now: string;
}

interface EggCalculationResult {
  newEggs: number;
  newLeftoverTime: number;
}

function calculateEggProduction(input: EggCalculationInput): EggCalculationResult {
  const { lastEggTime, leftoverTime, productionTimePerEgg, quantity, now } = input;
  
  const lastTime = new Date(lastEggTime);
  const currentTime = new Date(now);
  
  // Calculate time elapsed in minutes
  const timeElapsedMinutes = (currentTime.getTime() - lastTime.getTime()) / (1000 * 60);
  
  // Add previous leftover time
  const totalAvailableTime = timeElapsedMinutes + leftoverTime;
  
  // Calculate how many full production cycles can be completed
  const totalPossibleEggs = Math.floor(totalAvailableTime / productionTimePerEgg) * quantity;
  
  // Calculate remaining time that doesn't complete a full cycle
  const usedTime = Math.floor(totalAvailableTime / productionTimePerEgg) * productionTimePerEgg;
  const newLeftoverTime = totalAvailableTime - usedTime;
  
  return {
    newEggs: totalPossibleEggs,
    newLeftoverTime: newLeftoverTime
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { 
        global: { 
          headers: { authorization: authHeader } 
        },
        auth: { persistSession: false }
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log(`Starting egg production calculation for user: ${user.id}`);

    // Get user's farm
    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (farmError || !farm) {
      throw new Error('Farm not found for user');
    }

    console.log(`Found farm: ${farm.id}`);

    // Get all chickens for this farm with their types and leftover time
    const { data: chickens, error: chickensError } = await supabase
      .from('user_chickens')
      .select(`
        *,
        chicken_types (
          eggs_per_period,
          days_per_period
        )
      `)
      .eq('farm_id', farm.id);

    if (chickensError) {
      throw new Error(`Error fetching chickens: ${chickensError.message}`);
    }

    if (!chickens || chickens.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          totalNewEggs: 0, 
          message: "No chickens found" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get production settings
    const { data: settings, error: settingsError } = await supabase
      .from('production_settings')
      .select('setting_name, setting_value');

    if (settingsError) {
      console.warn('Error fetching production settings:', settingsError);
    }

    const productionSettings = {};
    settings?.forEach(setting => {
      productionSettings[setting.setting_name] = setting.setting_value;
    });

    const efficiencyBonus = parseFloat(productionSettings['production_efficiency_bonus'] || '1.0');
    const isEnabled = productionSettings['egg_collection_enabled'] === 'true';

    if (!isEnabled) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          totalNewEggs: 0, 
          message: "Egg production is disabled" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const now = new Date().toISOString();
    let totalNewEggs = 0;
    const chickenUpdates = [];

    // Calculate eggs for each chicken type
    for (const chicken of chickens) {
      const eggsPerPeriod = chicken.chicken_types?.eggs_per_period || 1;
      const daysPerPeriod = chicken.chicken_types?.days_per_period || 1;
      
      // Convert days to minutes for production time
      const productionTimePerEgg = (daysPerPeriod * 24 * 60) / eggsPerPeriod;
      
      // Apply efficiency bonus
      const adjustedProductionTime = productionTimePerEgg / efficiencyBonus;
      
      const result = calculateEggProduction({
        lastEggTime: chicken.last_egg_collection || chicken.created_at,
        leftoverTime: chicken.leftover_time_minutes || 0,
        productionTimePerEgg: adjustedProductionTime,
        quantity: chicken.quantity,
        now: now
      });

      if (result.newEggs > 0) {
        totalNewEggs += result.newEggs;
        
        // Update chicken record with new leftover time and last collection time
        chickenUpdates.push({
          id: chicken.id,
          last_egg_collection: now,
          leftover_time_minutes: result.newLeftoverTime
        });

        console.log(`Chicken ${chicken.id}: Produced ${result.newEggs} eggs, leftover time: ${result.newLeftoverTime} minutes`);
      }
    }

    // Update all chicken records
    if (chickenUpdates.length > 0) {
      for (const update of chickenUpdates) {
        const { error: updateError } = await supabase
          .from('user_chickens')
          .update({
            last_egg_collection: update.last_egg_collection,
            leftover_time_minutes: update.leftover_time_minutes
          })
          .eq('id', update.id);

        if (updateError) {
          console.error(`Error updating chicken ${update.id}:`, updateError);
        }
      }
    }

    // Update eggs inventory if new eggs were produced
    if (totalNewEggs > 0) {
      // Get current egg inventory
      const { data: eggInventory, error: eggError } = await supabase
        .from('eggs_inventory')
        .select('total_eggs, uncollected_eggs')
        .eq('farm_id', farm.id)
        .single();

      if (eggError && eggError.code !== 'PGRST116') {
        console.error('Error fetching egg inventory:', eggError);
      }

      const currentTotalEggs = eggInventory?.total_eggs || 0;
      const currentUncollectedEggs = eggInventory?.uncollected_eggs || 0;

      // Update egg inventory
      const { error: updateEggError } = await supabase
        .from('eggs_inventory')
        .upsert({
          farm_id: farm.id,
          total_eggs: currentTotalEggs + totalNewEggs,
          uncollected_eggs: currentUncollectedEggs + totalNewEggs
        }, {
          onConflict: 'farm_id'
        });

      if (updateEggError) {
        console.error('Error updating egg inventory:', updateEggError);
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          farm_id: farm.id,
          transaction_type: 'egg_collection',
          quantity: totalNewEggs,
          description: `Sản xuất tự động ${totalNewEggs} quả trứng`
        });

      if (transactionError) {
        console.error('Error recording transaction:', transactionError);
      }
    }

    console.log(`Egg production calculation completed. Total new eggs: ${totalNewEggs}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalNewEggs,
        farmId: farm.id,
        chickenUpdates: chickenUpdates.length,
        message: `Produced ${totalNewEggs} eggs successfully`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Calculate egg production error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to calculate egg production"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});