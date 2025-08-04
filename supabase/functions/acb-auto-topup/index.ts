import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  amount: number;
  accountName: string;
  transactionNumber: number;
  description: string;
  isOnline: boolean;
  postingDate: number;
  type: string;
  senderName: string;
  receiverAccountNumber: string;
  currency: string;
  account: number;
  activeDatetime: number;
  effectiveDate: number;
}

interface ACBApiResponse {
  success: boolean;
  message: string;
  transactions: Transaction[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting ACB auto top-up check...');

    // Get environment variables
    const acbPassword = Deno.env.get('ACB_PASSWORD');
    const acbAccountNumber = Deno.env.get('ACB_ACCOUNT_NUMBER');
    const web2mToken = Deno.env.get('WEB2M_ACB_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!acbPassword || !acbAccountNumber || !web2mToken) {
      console.error('Missing ACB credentials');
      return new Response(
        JSON.stringify({ error: 'Missing ACB credentials' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Missing Supabase credentials' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call Web2M ACB API
    const apiUrl = `https://api.web2m.com/historyapiacb/${acbPassword}/${acbAccountNumber}/${web2mToken}`;
    console.log('Calling Web2M API...');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch from Web2M API:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from Web2M API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: ACBApiResponse = await response.json();
    console.log('Web2M API response:', data);

    if (!data.success || !data.transactions) {
      console.log('No transactions or API error:', data.message);
      return new Response(
        JSON.stringify({ message: 'No transactions found or API error', details: data.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    let newTransactions = 0;

    // Process each transaction
    for (const transaction of data.transactions) {
      console.log('Processing transaction:', transaction.transactionNumber, transaction.description);

      // Check if already processed
      const { data: existingTransaction } = await supabase
        .from('processed_transactions')
        .select('id')
        .eq('transaction_number', transaction.transactionNumber)
        .single();

      if (existingTransaction) {
        console.log('Transaction already processed:', transaction.transactionNumber);
        continue;
      }

      // Check if description matches chicken{ID} pattern
      const chickenMatch = transaction.description.match(/chicken(\d+)/i);
      if (!chickenMatch) {
        console.log('Transaction does not match chicken pattern:', transaction.description);
        continue;
      }

      const numericId = parseInt(chickenMatch[1]);
      console.log('Found chicken ID:', numericId);

      // Find user by numeric_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('numeric_id', numericId)
        .single();

      if (profileError || !profile) {
        console.error('User not found for numeric_id:', numericId, profileError);
        continue;
      }

      console.log('Found user:', profile.id);

      // Get or create farm for the user
      let { data: farm, error: farmError } = await supabase
        .from('farms')
        .select('id, account_balance')
        .eq('user_id', profile.id)
        .single();

      if (farmError || !farm) {
        console.log('Creating new farm for user:', profile.id);
        const { data: newFarm, error: createFarmError } = await supabase
          .from('farms')
          .insert({
            user_id: profile.id,
            farm_name: 'My Farm',
            account_balance: 0
          })
          .select('id, account_balance')
          .single();

        if (createFarmError || !newFarm) {
          console.error('Failed to create farm:', createFarmError);
          continue;
        }
        farm = newFarm;
      }

      // Update account balance
      const newBalance = (farm.account_balance || 0) + transaction.amount;
      const { error: updateError } = await supabase
        .from('farms')
        .update({ account_balance: newBalance })
        .eq('id', farm.id);

      if (updateError) {
        console.error('Failed to update account balance:', updateError);
        continue;
      }

      console.log('Updated balance for farm:', farm.id, 'new balance:', newBalance);

      // Record transaction in transactions table
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          farm_id: farm.id,
          transaction_type: 'deposit',
          amount: transaction.amount,
          description: `Auto top-up from ACB: ${transaction.description}`,
          quantity: 1
        });

      if (transactionError) {
        console.error('Failed to record transaction:', transactionError);
      }

      // Mark transaction as processed
      const { error: processedError } = await supabase
        .from('processed_transactions')
        .insert({
          transaction_number: transaction.transactionNumber,
          posting_date: transaction.postingDate,
          amount: transaction.amount,
          description: transaction.description
        });

      if (processedError) {
        console.error('Failed to mark transaction as processed:', processedError);
      }

      processedCount++;
      newTransactions++;
      console.log('Successfully processed transaction:', transaction.transactionNumber);
    }

    console.log(`Auto top-up completed. Processed ${processedCount} new transactions`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processedCount} new transactions`,
        newTransactions 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ACB auto top-up:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});