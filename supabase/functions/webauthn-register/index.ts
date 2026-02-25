import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "https://esm.sh/@simplewebauthn/server@9.0.3";
import { encode as base64Encode, decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const step = url.searchParams.get('step');

    // Derive origin and rpId from request when env is not set
    const requestOriginHeader = req.headers.get('origin') || undefined;
    const derivedOrigin = requestOriginHeader && requestOriginHeader.startsWith('http')
      ? requestOriginHeader
      : undefined;
    const derivedRpId = derivedOrigin ? new URL(derivedOrigin).hostname : undefined;

    // Environment variables (with robust fallbacks)
    const RP_ID = Deno.env.get('RP_ID') || derivedRpId || 'localhost';
    const RP_NAME = Deno.env.get('RP_NAME') || 'Hệ thống báo giá';
    const RP_ORIGIN = Deno.env.get('RP_ORIGIN') || derivedOrigin || 'http://localhost:8080';
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Generate registration options
    if (step === 'options') {
      const { email, displayName } = await req.json();
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user by email
      const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
      const user = users?.find(u => u.email === email);
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Helper to decode base64url string to Uint8Array
      const base64urlToBytes = (s: string): Uint8Array => {
        const base64 = s.replace(/-/g, '+').replace(/_/g, '/');
        const padding = '='.repeat((4 - (base64.length % 4)) % 4);
        return base64Decode(base64 + padding);
      };

      // Check existing credentials for this user
      const { data: existingCreds } = await supabase
        .from('webauthn_credentials')
        .select('credential_id, transports')
        .eq('user_id', user.id);

      // Generate challenge
      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: user.id,
        userName: email,
        userDisplayName: displayName || email,
        attestationType: 'none',
        excludeCredentials: existingCreds?.map(cred => ({
          id: base64urlToBytes(cred.credential_id),
          type: 'public-key',
          transports: cred.transports as AuthenticatorTransport[],
        })) || [],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
      });

      // Store challenge
      await supabase.from('webauthn_challenges').insert({
        email,
        type: 'registration',
        challenge: options.challenge,
      });

      // Cleanup old challenges
      await supabase.rpc('cleanup_expired_challenges');

      return new Response(
        JSON.stringify(options),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Verify registration
    if (step === 'verify') {
      const { email, attestationResponse } = await req.json();

      if (!email || !attestationResponse) {
        return new Response(
          JSON.stringify({ error: 'Email and attestation response required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get challenge
      const { data: challengeData } = await supabase
        .from('webauthn_challenges')
        .select('challenge')
        .eq('email', email)
        .eq('type', 'registration')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!challengeData) {
        return new Response(
          JSON.stringify({ error: 'Challenge not found or expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const user = users?.find(u => u.email === email);

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify registration (support multiple acceptable origins)
      const acceptableOrigins = Array.from(new Set([RP_ORIGIN, derivedOrigin].filter(Boolean))) as string[];
      const verification = await verifyRegistrationResponse({
        response: attestationResponse,
        expectedChallenge: challengeData.challenge,
        expectedOrigin: acceptableOrigins.length > 1 ? acceptableOrigins : acceptableOrigins[0],
        expectedRPID: RP_ID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return new Response(
          JSON.stringify({ error: 'Verification failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

      // Convert to base64url for storage
      const credentialIdBase64 = base64Encode(new Uint8Array(credentialID).buffer as ArrayBuffer).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const publicKeyBase64 = base64Encode(new Uint8Array(credentialPublicKey).buffer as ArrayBuffer).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      // Store credential
      await supabase.from('webauthn_credentials').insert({
        user_id: user.id,
        email,
        credential_id: credentialIdBase64,
        public_key: publicKeyBase64,
        counter,
        transports: attestationResponse.response?.transports || [],
      });

      // Delete used challenge
      await supabase
        .from('webauthn_challenges')
        .delete()
        .eq('email', email)
        .eq('type', 'registration');

      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid step parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in webauthn-register:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
