import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { transactionId, type } = await req.json();
    console.log(`Processing refund for ${type}: ${transactionId}`);

    if (type === 'transaction') {
      // Get transaction details
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (txError || !transaction) {
        throw new Error('Transaction not found');
      }

      // Get farm details to find user_id
      const { data: farm, error: farmError } = await supabase
        .from('farms')
        .select('user_id, account_balance')
        .eq('id', transaction.farm_id)
        .single();

      if (farmError || !farm) {
        throw new Error('Farm not found');
      }

      // Refund money to farm balance - ensure we add positive amount
      const refundAmount = Math.abs(transaction.amount || 0);
      const newBalance = (farm.account_balance || 0) + refundAmount;
      const { error: balanceError } = await supabase
        .from('farms')
        .update({ account_balance: newBalance })
        .eq('id', transaction.farm_id);

      if (balanceError) throw balanceError;

      // Remove items from user's farm based on transaction type
      if (transaction.transaction_type === 'chicken_purchase') {
        // Find and reduce chicken quantity
        const { data: userChickens, error: chickenError } = await supabase
          .from('user_chickens')
          .select('*')
          .eq('farm_id', transaction.farm_id);

        if (!chickenError && userChickens) {
          for (const chicken of userChickens) {
            const newQuantity = Math.max(0, chicken.quantity - (transaction.quantity || 0));
            if (newQuantity === 0) {
              await supabase
                .from('user_chickens')
                .delete()
                .eq('id', chicken.id);
            } else {
              await supabase
                .from('user_chickens')
                .update({ quantity: newQuantity })
                .eq('id', chicken.id);
            }
          }
        }
      } else if (transaction.transaction_type === 'accessory_purchase') {
        // Find and reduce accessory quantity
        const { data: userAccessories, error: accessoryError } = await supabase
          .from('user_accessories')
          .select('*')
          .eq('farm_id', transaction.farm_id);

        if (!accessoryError && userAccessories) {
          for (const accessory of userAccessories) {
            const newQuantity = Math.max(0, accessory.quantity - (transaction.quantity || 0));
            if (newQuantity === 0) {
              await supabase
                .from('user_accessories')
                .delete()
                .eq('id', accessory.id);
            } else {
              await supabase
                .from('user_accessories')
                .update({ quantity: newQuantity })
                .eq('id', accessory.id);
            }
          }
        }
      }

      // Create refund transaction record using service role
      const { error: refundError } = await supabase
        .from('transactions')
        .insert({
          farm_id: transaction.farm_id,
          transaction_type: 'refund',
          amount: refundAmount,
          quantity: transaction.quantity,
          description: `Hoàn trả: ${transaction.description}`,
          user_email: transaction.user_email,
          user_name: transaction.user_name
        });

      if (refundError) {
        console.error('Refund transaction error:', refundError);
        throw refundError;
      }

      // Delete original transaction
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (deleteError) throw deleteError;

    } else if (type === 'payment') {
      // Handle payment refund
      const { data: payment, error: paymentError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (paymentError || !payment) {
        throw new Error('Payment not found');
      }

      // Get farm details
      const { data: farm, error: farmError } = await supabase
        .from('farms')
        .select('account_balance')
        .eq('user_id', payment.user_id)
        .single();

      if (farmError || !farm) {
        throw new Error('Farm not found for payment user');
      }

      // Refund money to farm balance - ensure we add positive amount
      const refundAmount = Math.abs(payment.amount || 0);
      const newBalance = (farm.account_balance || 0) + refundAmount;
      const { error: balanceError } = await supabase
        .from('farms')
        .update({ account_balance: newBalance })
        .eq('user_id', payment.user_id);

      if (balanceError) throw balanceError;

      // Remove farm rentals associated with this payment
      const { error: rentalError } = await supabase
        .from('farm_rentals')
        .delete()
        .eq('user_id', payment.user_id)
        .eq('status', 'active');

      if (rentalError) {
        console.error('Error removing farm rentals:', rentalError);
      } else {
        console.log('Farm rentals removed successfully');
      }

      // Remove user farm (delete the farm itself)
      const { error: farmDeleteError } = await supabase
        .from('farms')
        .delete()
        .eq('user_id', payment.user_id);

      if (farmDeleteError) {
        console.error('Error removing user farm:', farmDeleteError);
      } else {
        console.log('User farm removed successfully');
      }

      // Update payment status to refunded
      const { error: statusError } = await supabase
        .from('payment_transactions')
        .update({ status: 'refunded' })
        .eq('id', transactionId);

      if (statusError) throw statusError;
    }

    console.log(`Refund completed successfully for ${type}: ${transactionId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Refund completed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Refund error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});