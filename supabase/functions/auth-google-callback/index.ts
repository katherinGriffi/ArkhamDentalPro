// supabase/functions/auth-google-callback/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Definindo a interface para os dados do token (para tipagem)
interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

// Definindo os escopos que você está pedindo ao Google
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.readonly',
  'openid',
  'profile',
  'email'
];

// O principal handler da função
serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    console.error('Google OAuth Error:', error);
    // CORREÇÃO: Use backticks (`) e interpolação ${} corretamente
    return Response.redirect(`${Deno.env.get('FRONTEND_URL')}?error=${error}`, 302);
  }

  if (!code) {
    return new Response('No authorization code provided', { status: 400 });
  }

  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI');

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const FRONTEND_URL = Deno.env.get('FRONTEND_URL');

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !FRONTEND_URL) {
    console.error('Missing environment variables for Edge Function');
    return new Response('Configuration Error: Missing environment variables', { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData: TokenResponse = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Google Token Exchange Error:', tokenData.error_description || tokenData.error);
      // CORREÇÃO: Use backticks (`) e interpolação ${} corretamente
      return Response.redirect(`${FRONTEND_URL}?error=${tokenData.error_description || tokenData.error}`, 302);
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    let googleUserId = '';
    if (tokenData.id_token) {
      try {
        const decodedIdToken = JSON.parse(atob(tokenData.id_token.split('.')[1]));
        googleUserId = decodedIdToken.sub;
        console.log('Decoded Google User Info (from ID Token):', decodedIdToken);
      } catch (decodeError) {
        console.error('Error decoding ID token:', decodeError);
      }
    }

    const { data: dbData, error: dbError } = await supabase
      .from('google_tokens')
      .upsert({
        google_user_id: googleUserId,
        refresh_token: refresh_token,
        access_token_last_refreshed_at: new Date().toISOString(),
        scopes_granted: SCOPES,
      }, { onConflict: 'google_user_id' });

    if (dbError) {
      console.error('Error storing tokens in Supabase:', dbError);
      return Response.redirect(`${FRONTEND_URL}?error=database_error`, 302);
    }
    console.log('Tokens stored/updated in Supabase:', dbData);

    const finalRedirectUrl = new URL(FRONTEND_URL);
    finalRedirectUrl.searchParams.set('google_access_token', access_token);
    finalRedirectUrl.searchParams.set('google_expires_in', expiresIn.toString());

    return Response.redirect(finalRedirectUrl.toString(), 302);

  } catch (error) {
    console.error('An unexpected error occurred in Edge Function:', error);
    return Response.redirect(`${FRONTEND_URL}?error=internal_server_error`, 302);
  }
});