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
    // Check if user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Set auth header for user context
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create authenticated client for user context
    const userSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: isAdmin } = await userSupabase.rpc('is_admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check billing settings
    const { data: billingSettings, error: settingsError } = await supabase
      .from('billing_settings')
      .select('auto_monthly_billing_enabled')
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching billing settings:', settingsError);
      // Continue anyway if settings table doesn't exist or is empty
    }

    if (billingSettings && billingSettings.auto_monthly_billing_enabled === false) {
      return new Response(JSON.stringify({ error: 'Auto monthly billing is disabled' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const runTime = new Date();
    const runId = crypto.randomUUID();

    // Create billing run record
    const { error: runError } = await supabase
      .from('billing_runs')
      .insert({
        id: runId,
        type: 'manual',
        dry_run: false,
        initiated_by: user.id,
        status: 'running',
        started_at: runTime.toISOString()
      });

    if (runError) {
      console.error('Error creating billing run:', runError);
      return new Response(JSON.stringify({ error: 'Failed to create billing run' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
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
          farms!inner(id, user_id, account_balance)
        `)
        .in('status', ['active', 'suspended']);

      if (packagesError) {
        console.error('Error fetching packages:', packagesError);
        throw new Error(`Failed to fetch packages: ${packagesError.message}`);
      }

      // Get package prices with better error handling
      const { data: packagePrices, error: pricesError } = await supabase
        .from('package_prices')
        .select('package_id, daily_price');

      if (pricesError) {
        console.error('Error fetching package prices:', pricesError);
        throw new Error(`Failed to fetch prices: ${pricesError.message}`);
      }

      // Handle case when no packages found
      if (!packages || packages.length === 0) {
        // Update billing run as completed with no work
        await supabase
          .from('billing_runs')
          .update({
            status: 'completed',
            finished_at: new Date().toISOString(),
            summary_json: {
              total_customers: 0,
              total_packages: 0,
              total_amount: 0,
              success_count: 0,
              failed_count: 0,
              message: 'No active or suspended packages found'
            }
          })
          .eq('id', runId);

        return new Response(JSON.stringify({ 
          success: true,
          run_id: runId,
          summary: {
            total_customers: 0,
            total_packages: 0,
            success_count: 0,
            failed_count: 0,
            total_amount: 0,
            message: 'No active or suspended packages found'
          }
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Handle case when no package prices configured
      if (!packagePrices || packagePrices.length === 0) {
        throw new Error('No package prices configured. Please configure package prices first.');
      }

      const priceMap = new Map(packagePrices.map(p => [p.package_id, p.daily_price]));

      // Calculate billing for each package
      const customerBilling: Record<string, any> = {};
      const invoiceItems: any[] = [];
      const packageUpdates: any[] = [];

      for (const pkg of packages || []) {
        // Validate required package data
        if (!pkg.user_id || !pkg.farm_id || !pkg.package_id) {
          console.warn('Skipping package with missing required data:', pkg.id);
          continue;
        }

        // Ensure service_start_date exists
        if (!pkg.service_start_date) {
          console.warn('Skipping package without service_start_date:', pkg.id);
          continue;
        }

        const baseDate = pkg.last_billed_at ? new Date(pkg.last_billed_at) : new Date(pkg.service_start_date);
        const runDay = new Date(runTime.getFullYear(), runTime.getMonth(), runTime.getDate());
        const baseDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
        
        const daysElapsed = Math.max(0, Math.floor((runDay.getTime() - baseDay.getTime()) / (1000 * 60 * 60 * 24)));
        
        if (daysElapsed === 0) continue; // Skip if no days elapsed
        
        const dailyPrice = priceMap.get(pkg.package_id) || 0;
        if (dailyPrice === 0) {
          console.warn('No price found for package:', pkg.package_id);
          continue;
        }

        const selectedQuantity = pkg.selected_chicken_quantity || 0;
        if (selectedQuantity === 0) {
          console.warn('Package has zero chicken quantity:', pkg.id);
          continue;
        }

        const amount = Math.round(dailyPrice * selectedQuantity * daysElapsed);
        
        const customerId = pkg.user_id;
        if (!customerBilling[customerId]) {
          customerBilling[customerId] = {
            user_id: customerId,
            farm_id: pkg.farm_id,
            balance_before: (pkg.farms && pkg.farms.account_balance) || 0,
            total_amount: 0,
            packages: []
          };
        }
        
        customerBilling[customerId].total_amount += amount;
        customerBilling[customerId].packages.push(pkg.id);
        
        // Add to invoice items
        invoiceItems.push({
          invoice_id: null, // Will be filled later
          package_id: pkg.id,
          package_name: pkg.package_name || 'Unknown Package',
          daily_price: dailyPrice,
          quantity: selectedQuantity,
          days_elapsed: daysElapsed,
          amount: amount
        });

        // Add to package updates
        packageUpdates.push({
          id: pkg.id,
          last_billed_at: runTime.toISOString()
        });
      }

      // Process each customer
      let totalProcessed = 0;
      let totalSuccess = 0;
      let totalFailed = 0;

      for (const [customerId, customerBillingData] of Object.entries(customerBilling)) {
        const billing = customerBillingData as any;
        totalProcessed++;
        
        const balanceAfter = (billing.balance_before || 0) - (billing.total_amount || 0);
        const newStatus = balanceAfter >= 0 ? 'active' : 'suspended';

        try {
          // Start transaction for this customer
          const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
              run_id: runId,
              farm_id: billing.farm_id,
              user_id: customerId,
              total_amount: billing.total_amount,
              balance_before: billing.balance_before,
              balance_after: balanceAfter,
              status: balanceAfter >= 0 ? 'paid' : 'failed',
              metadata: {
                manual_billing: true,
                package_count: billing.packages.length,
                action: balanceAfter >= 0 ? 'normal' : 'suspend'
              }
            })
            .select()
            .single();

          if (invoiceError) throw invoiceError;

          // Insert invoice items
          const customerInvoiceItems = invoiceItems
            .filter(item => billing.packages.includes(item.package_id))
            .map(item => ({ ...item, invoice_id: invoice.id }));

          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(customerInvoiceItems);

          if (itemsError) throw itemsError;

          // Update farm balance
          const { error: balanceError } = await supabase
            .from('farms')
            .update({ account_balance: balanceAfter })
            .eq('id', billing.farm_id);

          if (balanceError) throw balanceError;

          // Update package statuses and last_billed_at
          const customerPackageUpdates = packageUpdates.filter(update => 
            billing.packages.includes(update.id)
          );

          for (const update of customerPackageUpdates) {
            const { error: packageError } = await supabase
              .from('service_packages')
              .update({
                last_billed_at: update.last_billed_at,
                status: newStatus
              })
              .eq('id', update.id);

            if (packageError) throw packageError;
          }

          // Create transaction record
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              farm_id: billing.farm_id,
              transaction_type: 'monthly_billing',
              amount: -billing.total_amount,
              description: `Thanh toán thủ công - ${billing.packages.length} gói dịch vụ`
            });

          if (transactionError) throw transactionError;

          // Send notification
          const notificationTitle = balanceAfter >= 0 
            ? 'Thanh toán thành công'
            : 'Số dư không đủ - Dịch vụ tạm dừng';
          
          const notificationContent = balanceAfter >= 0
            ? `Đã thanh toán ${(billing.total_amount || 0).toLocaleString('vi-VN')} VND cho ${billing.packages.length} gói dịch vụ. Số dư còn lại: ${balanceAfter.toLocaleString('vi-VN')} VND.`
            : `Số dư không đủ để thanh toán ${(billing.total_amount || 0).toLocaleString('vi-VN')} VND. Các gói dịch vụ đã bị tạm dừng. Vui lòng nạp thêm tiền.`;

          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: customerId,
              title: notificationTitle,
              content: notificationContent,
              type: balanceAfter >= 0 ? 'success' : 'warning',
              send_email: false,
              status: 'sent',
              metadata: {
                billing_run_id: runId,
                invoice_id: invoice.id,
                manual_billing: true
              }
            });

          if (notificationError) console.error('Notification error:', notificationError);

          totalSuccess++;

        } catch (customerError) {
          console.error(`Error processing customer ${customerId}:`, customerError);
          totalFailed++;
        }
      }

      // Update billing run as completed
      const { error: updateRunError } = await supabase
        .from('billing_runs')
        .update({
          status: 'completed',
          finished_at: new Date().toISOString(),
          summary_json: {
            total_customers: totalProcessed,
            total_packages: invoiceItems.length,
            total_amount: Object.values(customerBilling).reduce((sum: number, c: any) => sum + c.total_amount, 0),
            success_count: totalSuccess,
            failed_count: totalFailed
          }
        })
        .eq('id', runId);

      if (updateRunError) console.error('Error updating billing run:', updateRunError);

      return new Response(JSON.stringify({ 
        success: true,
        run_id: runId,
        summary: {
          total_customers: totalProcessed,
          total_packages: invoiceItems.length,
          success_count: totalSuccess,
          failed_count: totalFailed,
          total_amount: Object.values(customerBilling).reduce((sum: number, c: any) => sum + c.total_amount, 0)
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      // Update billing run as failed
      await supabase
        .from('billing_runs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          summary_json: { error: error.message }
        })
        .eq('id', runId);

      throw error;
    }

  } catch (error) {
    console.error('Manual billing commit error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});