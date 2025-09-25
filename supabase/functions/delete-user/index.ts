import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from request
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log(`Starting deletion process for user: ${userId}`);

    // Get user's farm IDs first
    const { data: userFarms, error: farmsFetchError } = await supabase
      .from('farms')
      .select('id')
      .eq('user_id', userId);

    if (farmsFetchError) {
      throw new Error(`Failed to fetch user farms: ${farmsFetchError.message}`);
    }

    const farmIds = userFarms?.map(farm => farm.id) || [];
    console.log(`Found ${farmIds.length} farms for user`);

    // Start transaction by deleting all related data
    const deletionSteps = [];

    // 1. Delete user accessories
    if (farmIds.length > 0) {
      const { error: accessoriesError } = await supabase
        .from('user_accessories')
        .delete()
        .in('farm_id', farmIds);
      
      if (accessoriesError) {
        console.log('Error deleting accessories:', accessoriesError);
        deletionSteps.push({ step: 'accessories', error: accessoriesError });
      } else {
        deletionSteps.push({ step: 'accessories', success: true });
      }
    } else {
      deletionSteps.push({ step: 'accessories', success: true, message: 'No farms to process' });
    }

    // 2. Delete user chickens
    if (farmIds.length > 0) {
      const { error: chickensError } = await supabase
        .from('user_chickens') 
        .delete()
        .in('farm_id', farmIds);

      if (chickensError) {
        console.log('Error deleting chickens:', chickensError);
        deletionSteps.push({ step: 'chickens', error: chickensError });
      } else {
        deletionSteps.push({ step: 'chickens', success: true });
      }
    } else {
      deletionSteps.push({ step: 'chickens', success: true, message: 'No farms to process' });
    }

    // 3. Delete egg inventory
    if (farmIds.length > 0) {
      const { error: eggsError } = await supabase
        .from('eggs_inventory')
        .delete()
        .in('farm_id', farmIds);

      if (eggsError) {
        console.log('Error deleting eggs inventory:', eggsError);
        deletionSteps.push({ step: 'eggs_inventory', error: eggsError });
      } else {
        deletionSteps.push({ step: 'eggs_inventory', success: true });
      }
    } else {
      deletionSteps.push({ step: 'eggs_inventory', success: true, message: 'No farms to process' });
    }

    // 4. Delete service packages (and their related data)
    const { data: userPackages } = await supabase
      .from('service_packages')
      .select('id')
      .eq('user_id', userId);

    if (userPackages && userPackages.length > 0) {
      for (const pkg of userPackages) {
        // Delete invoice items for this package
        await supabase
          .from('invoice_items')
          .delete()
          .eq('package_id', pkg.id);

        // Delete monthly bills for this package
        if (farmIds.length > 0) {
          await supabase
            .from('monthly_bills')
            .delete()
            .in('farm_id', farmIds);
        }
      }
    }

    const { error: packagesError } = await supabase
      .from('service_packages')
      .delete()
      .eq('user_id', userId);

    if (packagesError) {
      console.log('Error deleting packages:', packagesError);
      deletionSteps.push({ step: 'service_packages', error: packagesError });
    } else {
      deletionSteps.push({ step: 'service_packages', success: true });
    }

    // 5. Delete farm rentals
    const { error: rentalsError } = await supabase
      .from('farm_rentals')
      .delete()
      .eq('user_id', userId);

    if (rentalsError) {
      console.log('Error deleting farm rentals:', rentalsError);
      deletionSteps.push({ step: 'farm_rentals', error: rentalsError });
    } else {
      deletionSteps.push({ step: 'farm_rentals', success: true });
    }

    // 6. Delete transactions
    if (farmIds.length > 0) {
      const { error: transactionsError } = await supabase
        .from('transactions')
        .delete()
        .in('farm_id', farmIds);

      if (transactionsError) {
        console.log('Error deleting transactions:', transactionsError);
        deletionSteps.push({ step: 'transactions', error: transactionsError });
      } else {
        deletionSteps.push({ step: 'transactions', success: true });
      }
    } else {
      deletionSteps.push({ step: 'transactions', success: true, message: 'No farms to process' });
    }

    // 7. Delete invoices
    const { error: invoicesError } = await supabase
      .from('invoices')
      .delete()
      .eq('user_id', userId);

    if (invoicesError) {
      console.log('Error deleting invoices:', invoicesError);
      deletionSteps.push({ step: 'invoices', error: invoicesError });
    } else {
      deletionSteps.push({ step: 'invoices', success: true });
    }

    // 8. Delete payment transactions
    const { error: paymentsError } = await supabase
      .from('payment_transactions')
      .delete()
      .eq('user_id', userId);

    if (paymentsError) {
      console.log('Error deleting payment transactions:', paymentsError);
      deletionSteps.push({ step: 'payment_transactions', error: paymentsError });
    } else {
      deletionSteps.push({ step: 'payment_transactions', success: true });
    }

    // 9. Delete farms
    const { error: farmsError } = await supabase
      .from('farms')
      .delete()
      .eq('user_id', userId);

    if (farmsError) {
      console.log('Error deleting farms:', farmsError);
      deletionSteps.push({ step: 'farms', error: farmsError });
    } else {
      deletionSteps.push({ step: 'farms', success: true });
    }

    // 10. Delete notifications
    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (notificationsError) {
      console.log('Error deleting notifications:', notificationsError);
      deletionSteps.push({ step: 'notifications', error: notificationsError });
    } else {
      deletionSteps.push({ step: 'notifications', success: true });
    }

    // 11. Delete egg adjustments
    const { error: eggAdjustmentsError } = await supabase
      .from('egg_adjustments')
      .delete()
      .eq('user_id', userId);

    if (eggAdjustmentsError) {
      console.log('Error deleting egg adjustments:', eggAdjustmentsError);
      deletionSteps.push({ step: 'egg_adjustments', error: eggAdjustmentsError });
    } else {
      deletionSteps.push({ step: 'egg_adjustments', success: true });
    }

    // 12. Delete media files
    const { error: mediaError } = await supabase
      .from('media_files')
      .delete()
      .eq('user_id', userId);

    if (mediaError) {
      console.log('Error deleting media files:', mediaError);
      deletionSteps.push({ step: 'media_files', error: mediaError });
    } else {
      deletionSteps.push({ step: 'media_files', success: true });
    }

    // 13. Delete user roles
    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (rolesError) {
      console.log('Error deleting user roles:', rolesError);
      deletionSteps.push({ step: 'user_roles', error: rolesError });
    } else {
      deletionSteps.push({ step: 'user_roles', success: true });
    }

    // 14. Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.log('Error deleting profile:', profileError);
      deletionSteps.push({ step: 'profiles', error: profileError });
    } else {
      deletionSteps.push({ step: 'profiles', success: true });
    }

    // 15. Finally delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.log('Error deleting auth user:', authError);
      deletionSteps.push({ step: 'auth_user', error: authError });
    } else {
      deletionSteps.push({ step: 'auth_user', success: true });
    }

    console.log('Deletion process completed:', deletionSteps);

    const hasErrors = deletionSteps.some(step => step.error);
    
    return new Response(
      JSON.stringify({
        success: !hasErrors,
        message: hasErrors ? 'Có lỗi xảy ra trong quá trình xóa' : 'Đã xóa người dùng thành công',
        deletionSteps
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: hasErrors ? 500 : 200
      }
    );

  } catch (error) {
    console.error('Error in delete-user function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
});