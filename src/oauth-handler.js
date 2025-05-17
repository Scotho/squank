// src/oauth-handler.js
const clientId    = '9eee0d34-0618-4eb2-bbfe-881eb155914d';
const redirectUri = 'https://scotho.github.io/squank/#/auth/callback';
const authUri     = 'https://www.warcraftlogs.com/oauth/authorize';
const tokenUri    = 'https://www.warcraftlogs.com/oauth/token';

function generateCodeVerifier(length = 128) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values  = new Uint32Array(length);
  crypto.getRandomValues(values);
  return [...values]
    .map((v) => charset[v % charset.length])
    .join('');
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data    = encoder.encode(plain);
  const hash    = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function startOAuth() {
  const verifier = generateCodeVerifier();
  const challenge = await sha256(verifier);

  // store PKCE verifier & state in sessionStorage
  sessionStorage.setItem('pkce_verifier', verifier);
  const state = crypto.randomUUID();
  sessionStorage.setItem('oauth_state', state);

  const url = new URL(authUri);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');

  window.location.href = url.toString();
}

export async function handleRedirect() {
  console.log('[OAuth] Starting redirect handler');

  // 1️⃣ Pull code/state from either search or from inside the hash
  let code, state;
  if (window.location.search) {
    const params = new URLSearchParams(window.location.search);
    code  = params.get('code');
    state = params.get('state');
  } else if (window.location.hash.includes('?')) {
    const [, query] = window.location.hash.split('?');
    const params    = new URLSearchParams(query);
    code  = params.get('code');
    state = params.get('state');
  }

  console.log('[OAuth] Code:', code);
  console.log('[OAuth] State:', state);

  // 2️⃣ Compare against the one you saved in startOAuth()
  const savedState = sessionStorage.getItem('oauth_state');
  console.log('[OAuth] Saved State:', savedState);
  if (state !== savedState) {
    console.error('[OAuth] State mismatch');
    return;
  }

  // 3️⃣ Grab the PKCE verifier
  const verifier = sessionStorage.getItem('pkce_verifier');
  console.log('[OAuth] Verifier:', verifier);

  try {
    // 4️⃣ Exchange code for token
    const res = await fetch(tokenUri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        client_id:     clientId,
        redirect_uri:  redirectUri,
        code_verifier: verifier,
      }),
    });
    const data = await res.json();
    console.log('[OAuth] Token exchange response:', data);

    if (!data.access_token) {
      console.error('[OAuth] Token exchange failed:', data);
      return;
    }

    // 5️⃣ Save it where your <Header> will look for it
    sessionStorage.setItem('access_token', data.access_token);
    console.log('[OAuth] Access token saved');

    // 6️⃣ Clean up the URL (remove the ?code=…&state=…)
    const cleanHash = window.location.hash.split('?')[0];
    window.history.replaceState({}, '', window.location.pathname + cleanHash);

    // 7️⃣ Finally, send the user back to “home” in your hash router
    window.location.hash = '#/';
  } catch (err) {
    console.error('[OAuth] Network error during token exchange:', err);
  }
}