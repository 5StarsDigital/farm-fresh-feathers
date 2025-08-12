import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const runTime = new Date();
    
    // Get all active and suspended packages with better error handling
    const { data: packages, error: packagesError } = await supabase
      .from('service_packages')
      .select(`
        id,
        user_id,
        farm_id,
        package_id,
        package_name,
        selected_chicken_quantity,
        last_billed_at,
        service_start_date,
        status,
        farms!inner(user_id, account_balance),
        profiles!inner(id, full_name)
      `)
      .in('status', ['active', 'suspended']);

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch packages', 
        details: packagesError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get package prices with better error handling
    const { data: packagePrices, error: pricesError } = await supabase
      .from('package_prices')
      .select('package_id, daily_price');

    if (pricesError) {
      console.error('Error fetching package prices:', pricesError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch prices', 
        details: pricesError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle case when no packages or prices found
    if (!packages || packages.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        customers: [],
        run_time: runTime.toISOString(),
        summary: {
          total_customers: 0,
          total_packages: 0,
          total_amount: 0
        },
        message: 'No active or suspended packages found'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!packagePrices || packagePrices.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No package prices configured', 
        details: 'Please configure package prices first' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const priceMap = new Map(packagePrices.map(p => [p.package_id, p.daily_price]));

    // Calculate billing for each package
    const customerBilling: Record<string, any> = {};

    for (const pkg of packages || []) {
      const baseDate = pkg.last_billed_at ? new Date(pkg.last_billed_at) : new Date(pkg.service_start_date);
      const runDay = new Date(runTime.getFullYear(), runTime.getMonth(), runTime.getDate());
      const baseDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
      
      const daysElapsed = Math.max(0, Math.floor((runDay.getTime() - baseDay.getTime()) / (1000 * 60 * 60 * 24)));
      
      if (daysElapsed === 0) continue; // Skip if no days elapsed
      
      const dailyPrice = priceMap.get(pkg.package_id) || 0;
      const amount = Math.round(dailyPrice * pkg.selected_chicken_quantity * daysElapsed);
      
      const customerId = pkg.user_id;
      if (!customerBilling[customerId]) {
        customerBilling[customerId] = {
          customer_id: customerId,
          customer_name: pkg.profiles.full_name || 'Unknown',
          balance_before: pkg.farms.account_balance || 0,
          packages: [],
          total_amount: 0
        };
      }
      
      customerBilling[customerId].packages.push({
        package_id: pkg.id,
        package_name: pkg.package_name,
        daily_price: dailyPrice,
        quantity: pkg.selected_chicken_quantity,
        days_elapsed: daysElapsed,
        amount: amount
      });
      
      customerBilling[customerId].total_amount += amount;
    }

    // Calculate balance after and action for each customer
    const results = Object.values(customerBilling).map((customer: any) => {
      const balanceAfter = customer.balance_before - customer.total_amount;
      let action = 'skip';
      
      if (customer.total_amount > 0) {
        action = balanceAfter >= 0 ? 'normal' : 'suspend';
      }
      
      return {
        ...customer,
        balance_after: balanceAfter,
        action
      };
    });

    return new Response(JSON.stringify({ 
      success: true, 
      customers: results,
      run_time: runTime.toISOString(),
      summary: {
        total_customers: results.length,
        total_packages: results.reduce((sum, c) => sum + c.packages.length, 0),
        total_amount: results.reduce((sum, c) => sum + c.total_amount, 0)
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Manual billing preview error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});