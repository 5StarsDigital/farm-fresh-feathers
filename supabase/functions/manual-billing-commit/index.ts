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

    // Check billing settings
    const { data: billingSettings } = await supabase
      .from('billing_settings')
      .select('auto_monthly_billing_enabled')
      .single();

    if (billingSettings && !billingSettings.auto_monthly_billing_enabled) {
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
      // Get all active and suspended packages
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
          farms!inner(user_id, account_balance)
        `)
        .in('status', ['active', 'suspended']);

      if (packagesError) throw packagesError;

      // Get package prices
      const { data: packagePrices, error: pricesError } = await supabase
        .from('package_prices')
        .select('package_id, daily_price');

      if (pricesError) throw pricesError;

      const priceMap = new Map(packagePrices.map(p => [p.package_id, p.daily_price]));

      // Calculate billing for each package
      const customerBilling: Record<string, any> = {};
      const invoiceItems: any[] = [];
      const packageUpdates: any[] = [];

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
            user_id: customerId,
            farm_id: pkg.farm_id,
            balance_before: pkg.farms.account_balance || 0,
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
          package_name: pkg.package_name,
          daily_price: dailyPrice,
          quantity: pkg.selected_chicken_quantity,
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

      for (const [customerId, billing] of Object.entries(customerBilling)) {
        totalProcessed++;
        
        const balanceAfter = billing.balance_before - billing.total_amount;
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
            ? `Đã thanh toán ${billing.total_amount.toLocaleString('vi-VN')} VND cho ${billing.packages.length} gói dịch vụ. Số dư còn lại: ${balanceAfter.toLocaleString('vi-VN')} VND.`
            : `Số dư không đủ để thanh toán ${billing.total_amount.toLocaleString('vi-VN')} VND. Các gói dịch vụ đã bị tạm dừng. Vui lòng nạp thêm tiền.`;

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