import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid token')
    }

    console.log('Clearing data for user:', user.id)

    // Get user's farm
    const { data: farm } = await supabaseAdmin
      .from('farms')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!farm) {
      throw new Error('No farm found for user')
    }

    // Delete user's transaction history
    const { error: transactionsError } = await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('farm_id', farm.id)

    if (transactionsError) {
      console.error('Error deleting transactions:', transactionsError)
    }

    // Delete user's chickens
    const { error: chickensError } = await supabaseAdmin
      .from('user_chickens')
      .delete()
      .eq('farm_id', farm.id)

    if (chickensError) {
      console.error('Error deleting chickens:', chickensError)
    }

    // Delete user's accessories
    const { error: accessoriesError } = await supabaseAdmin
      .from('user_accessories')
      .delete()
      .eq('farm_id', farm.id)

    if (accessoriesError) {
      console.error('Error deleting accessories:', accessoriesError)
    }

    // Delete user's farm rentals
    const { error: rentalsError } = await supabaseAdmin
      .from('farm_rentals')
      .delete()
      .eq('user_id', user.id)

    if (rentalsError) {
      console.error('Error deleting farm rentals:', rentalsError)
    }

    // Delete user's payment transactions
    const { error: paymentsError } = await supabaseAdmin
      .from('payment_transactions')
      .delete()
      .eq('user_id', user.id)

    if (paymentsError) {
      console.error('Error deleting payment transactions:', paymentsError)
    }

    // Delete user's eggs inventory
    const { error: eggsError } = await supabaseAdmin
      .from('eggs_inventory')
      .delete()
      .eq('farm_id', farm.id)

    if (eggsError) {
      console.error('Error deleting eggs inventory:', eggsError)
    }

    // Reset farm balance to 0
    const { error: farmError } = await supabaseAdmin
      .from('farms')
      .update({ account_balance: 0 })
      .eq('id', farm.id)

    if (farmError) {
      console.error('Error resetting farm balance:', farmError)
    }

    console.log('Successfully cleared all user data')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Đã xóa thành công lịch sử giao dịch và sản phẩm đã mua' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})