import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("Starting automatic egg collection...");

    // Get all farms
    const { data: farms, error: farmsError } = await supabaseService
      .from('farms')
      .select('id');

    if (farmsError) throw farmsError;

    let totalEggsCollected = 0;
    let farmsProcessed = 0;

    for (const farm of farms) {
      try {
        // Get chickens for this farm
        const { data: chickens, error: chickensError } = await supabaseService
          .from('user_chickens')
          .select(`
            *,
            chicken_types (eggs_per_period, days_per_period)
          `)
          .eq('farm_id', farm.id);

        if (chickensError) throw chickensError;

        if (!chickens || chickens.length === 0) continue;

        // Calculate total eggs to add (every 2 days each chicken produces eggs based on their type)
        let totalNewEggs = 0;
        const now = new Date();

        for (const chicken of chickens) {
          const lastCollection = new Date(chicken.last_egg_collection);
          const hoursSinceLastCollection = (now.getTime() - lastCollection.getTime()) / (1000 * 60 * 60);
          
          // Get egg production settings from chicken type
          const eggsPerPeriod = chicken.chicken_types?.eggs_per_period || 1;
          const daysPerPeriod = chicken.chicken_types?.days_per_period || 1;
          const hoursPerPeriod = daysPerPeriod * 24;
          
          // If it's been more than the required period, collect eggs
          if (hoursSinceLastCollection >= hoursPerPeriod) {
            const eggsFromThisChicken = chicken.quantity * eggsPerPeriod;
            totalNewEggs += eggsFromThisChicken;

            // Update last collection time
            await supabaseService
              .from('user_chickens')
              .update({ last_egg_collection: now.toISOString() })
              .eq('id', chicken.id);
          }
        }

        if (totalNewEggs > 0) {
          // Get current egg inventory
          const { data: eggInventory, error: eggError } = await supabaseService
            .from('eggs_inventory')
            .select('total_eggs')
            .eq('farm_id', farm.id)
            .single();

          if (eggError && eggError.code !== 'PGRST116') throw eggError;

          const currentEggs = eggInventory?.total_eggs || 0;

          // Update or create egg inventory
          const { error: updateEggError } = await supabaseService
            .from('eggs_inventory')
            .upsert({
              farm_id: farm.id,
              total_eggs: currentEggs + totalNewEggs
            });

          if (updateEggError) throw updateEggError;

          // Record transaction
          await supabaseService
            .from('transactions')
            .insert({
              farm_id: farm.id,
              transaction_type: 'egg_collection',
              quantity: totalNewEggs,
              description: `Thu hoạch tự động ${totalNewEggs} quả trứng`
            });

          totalEggsCollected += totalNewEggs;
          console.log(`Farm ${farm.id}: Collected ${totalNewEggs} eggs`);
        }

        farmsProcessed++;
      } catch (farmError) {
        console.error(`Error processing farm ${farm.id}:`, farmError);
        // Continue with other farms even if one fails
      }
    }

    console.log(`Automatic egg collection completed. Processed ${farmsProcessed} farms, collected ${totalEggsCollected} eggs total.`);

    return new Response(
      JSON.stringify({
        success: true,
        farmsProcessed,
        totalEggsCollected,
        message: `Automatic egg collection completed successfully`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Auto collect eggs error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to perform automatic egg collection"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});