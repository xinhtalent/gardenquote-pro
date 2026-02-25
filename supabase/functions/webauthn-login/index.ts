import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
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

    // Derive origin / rpId from request when env missing
    const requestOriginHeader = req.headers.get('origin') || undefined;
    const derivedOrigin = requestOriginHeader && requestOriginHeader.startsWith('http')
      ? requestOriginHeader
      : undefined;
    const derivedRpId = derivedOrigin ? new URL(derivedOrigin).hostname : undefined;

    // Environment variables with robust fallbacks
    const RP_ID = Deno.env.get('RP_ID') || derivedRpId || 'localhost';
    const RP_ORIGIN = Deno.env.get('RP_ORIGIN') || derivedOrigin || 'http://localhost:8080';
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Generate authentication options
    if (step === 'options') {
      const { email } = await req.json();
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user credentials
      const { data: credentials, error: credsError } = await supabase
        .from('webauthn_credentials')
        .select('credential_id, transports')
        .eq('email', email);

      if (credsError || !credentials || credentials.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No credentials found for this email' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Helper to decode base64url to Uint8Array
      const base64urlToBytes = (s: string): Uint8Array => {
        const base64 = s.replace(/-/g, '+').replace(/_/g, '/');
        const padding = '='.repeat((4 - (base64.length % 4)) % 4);
        return base64Decode(base64 + padding);
      };

      // Generate authentication options
      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials: credentials.map(cred => {
          return {
            id: base64urlToBytes(cred.credential_id),
            type: 'public-key' as const,
            transports: cred.transports as AuthenticatorTransport[],
          };
        }),
        userVerification: 'required',
      });

      // Store challenge
      await supabase.from('webauthn_challenges').insert({
        email,
        type: 'authentication',
        challenge: options.challenge,
      });

      // Cleanup old challenges
      await supabase.rpc('cleanup_expired_challenges');

      return new Response(
        JSON.stringify(options),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Verify authentication
    if (step === 'verify') {
      const { email, assertionResponse } = await req.json();

      if (!email || !assertionResponse) {
        return new Response(
          JSON.stringify({ error: 'Email and assertion response required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get challenge
      const { data: challengeData } = await supabase
        .from('webauthn_challenges')
        .select('challenge')
        .eq('email', email)
        .eq('type', 'authentication')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!challengeData) {
        return new Response(
          JSON.stringify({ error: 'Challenge not found or expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get credential
      // The credential ID is already a base64url string in `id` per WebAuthn spec
      // Prefer `id` and fall back to `rawId` if needed (both base64url)
      const credentialIdBase64 = assertionResponse.id || assertionResponse.rawId;

      const { data: credential } = await supabase
        .from('webauthn_credentials')
        .select('*')
        .eq('email', email)
        .eq('credential_id', credentialIdBase64)
        .single();

      if (!credential) {
        return new Response(
          JSON.stringify({ error: 'Credential not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Convert stored base64url strings back to Uint8Array for verification
      const credentialIdBytes = base64Decode(credential.credential_id.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - credential.credential_id.length % 4) % 4));
      const publicKeyBytes = base64Decode(credential.public_key.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - credential.public_key.length % 4) % 4));

      // Verify authentication (support multiple acceptable origins)
      const acceptableOrigins = Array.from(new Set([RP_ORIGIN, derivedOrigin].filter(Boolean))) as string[];
      const verification = await verifyAuthenticationResponse({
        response: assertionResponse,
        expectedChallenge: challengeData.challenge,
        expectedOrigin: acceptableOrigins.length > 1 ? acceptableOrigins : acceptableOrigins[0],
        expectedRPID: RP_ID,
        authenticator: {
          credentialID: credentialIdBytes,
          credentialPublicKey: publicKeyBytes,
          counter: credential.counter,
        },
      });

      if (!verification.verified) {
        return new Response(
          JSON.stringify({ error: 'Authentication verification failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update counter
      await supabase
        .from('webauthn_credentials')
        .update({ counter: verification.authenticationInfo.newCounter })
        .eq('id', credential.id);

      // Delete used challenge
      await supabase
        .from('webauthn_challenges')
        .delete()
        .eq('email', email)
        .eq('type', 'authentication');

      // Generate magic link OTP for this user
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
      });

      if (linkError || !linkData) {
        console.error('Error generating magic link:', linkError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate authentication token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract OTP from the properties (different versions may have different property names)
      const emailOtp = linkData.properties?.email_otp || 
                       linkData.properties?.hashed_token ||
                       (linkData as any).email_otp;

      if (!emailOtp) {
        console.error('No OTP found in link data:', linkData);
        return new Response(
          JSON.stringify({ error: 'Failed to extract authentication token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          email, 
          email_otp: emailOtp 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid step parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in webauthn-login:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
