import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, reassignToUserId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Check if user has customers or quotes
    const [customersResult, quotesResult] = await Promise.all([
      supabaseAdmin.from('customers').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    const hasData = (customersResult.count || 0) > 0 || (quotesResult.count || 0) > 0;

    if (hasData) {
      // Validate reassignToUserId is provided
      if (!reassignToUserId) {
        return new Response(
          JSON.stringify({ error: 'reassignToUserId is required when user has data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify reassignToUserId exists
      const { data: targetUser } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', reassignToUserId)
        .single();

      if (!targetUser) {
        return new Response(
          JSON.stringify({ error: 'Target user does not exist' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Reassign customers and quotes in transaction
      console.log(`Reassigning ${customersResult.count} customers and ${quotesResult.count} quotes from ${userId} to ${reassignToUserId}`);

      const [customersUpdate, quotesUpdate] = await Promise.all([
        supabaseAdmin.from('customers').update({ user_id: reassignToUserId }).eq('user_id', userId),
        supabaseAdmin.from('quotes').update({ user_id: reassignToUserId }).eq('user_id', userId),
      ]);

      if (customersUpdate.error) {
        console.error('Error reassigning customers:', customersUpdate.error);
        throw new Error(`Failed to reassign customers: ${customersUpdate.error.message}`);
      }

      if (quotesUpdate.error) {
        console.error('Error reassigning quotes:', quotesUpdate.error);
        throw new Error(`Failed to reassign quotes: ${quotesUpdate.error.message}`);
      }

      console.log('Successfully reassigned all data');
    }

    // Delete the user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) throw error;

    console.log(`Successfully deleted user ${userId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in delete-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
