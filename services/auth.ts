import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, CLIENT_ID, REDIRECT_URI, DEVICE_ID } from '~/config/api';

/* ------------------------------------------------------------------ */
/*  Storage keys                                                        */
/* ------------------------------------------------------------------ */

const STORAGE_KEYS = {
  accessToken: '@auth/access_token',
  refreshToken: '@auth/refresh_token',
  expiresAt: '@auth/expires_at',
} as const;

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix ms
}

/* ------------------------------------------------------------------ */
/*  PKCE helpers (pure-JS, no crypto.subtle needed)                    */
/* ------------------------------------------------------------------ */

function base64URLEncode(bytes: Uint8Array): string {
  let str = '';
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateCodeVerifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Pure JS SHA-256 — works in Hermes without crypto.subtle
function sha256(message: string): Uint8Array {
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ];
  let h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const msg: number[] = [];
  for (let i = 0; i < message.length; i++) {
    const c = message.charCodeAt(i);
    if (c < 128) { msg.push(c); }
    else if (c < 2048) { msg.push((c >> 6) | 192, (c & 63) | 128); }
    else { msg.push((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128); }
  }
  const bitLen = msg.length * 8;
  msg.push(0x80);
  while (msg.length % 64 !== 56) msg.push(0);
  msg.push(0,0,0,0,(bitLen >>> 24)&0xff,(bitLen >>> 16)&0xff,(bitLen >>> 8)&0xff,bitLen&0xff);
  const r = (n: number, d: number) => (n >>> d) | (n << (32 - d));
  for (let i = 0; i < msg.length; i += 64) {
    const w = new Array(64);
    for (let j = 0; j < 16; j++) w[j] = (msg[i+j*4]<<24)|(msg[i+j*4+1]<<16)|(msg[i+j*4+2]<<8)|msg[i+j*4+3];
    for (let j = 16; j < 64; j++) {
      const s0 = r(w[j-15],7)^r(w[j-15],18)^(w[j-15]>>>3);
      const s1 = r(w[j-2],17)^r(w[j-2],19)^(w[j-2]>>>10);
      w[j] = (w[j-16]+s0+w[j-7]+s1)|0;
    }
    let [a,b,c,d,e,f,g,hh] = h;
    for (let j = 0; j < 64; j++) {
      const S1 = r(e,6)^r(e,11)^r(e,25);
      const ch = (e&f)^(~e&g);
      const t1 = (hh+S1+ch+K[j]+w[j])|0;
      const S0 = r(a,2)^r(a,13)^r(a,22);
      const maj = (a&b)^(a&c)^(b&c);
      const t2 = (S0+maj)|0;
      hh=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
    }
    h[0]=(h[0]+a)|0; h[1]=(h[1]+b)|0; h[2]=(h[2]+c)|0; h[3]=(h[3]+d)|0;
    h[4]=(h[4]+e)|0; h[5]=(h[5]+f)|0; h[6]=(h[6]+g)|0; h[7]=(h[7]+hh)|0;
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    out[i*4]=(h[i]>>>24)&0xff; out[i*4+1]=(h[i]>>>16)&0xff;
    out[i*4+2]=(h[i]>>>8)&0xff; out[i*4+3]=h[i]&0xff;
  }
  return out;
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  return base64URLEncode(sha256(verifier));
}

/* ------------------------------------------------------------------ */
/*  OAuth steps                                                         */
/* ------------------------------------------------------------------ */

/** Step 1: GET /oauth/authorize → { auth_request_id, state } */
async function getAuthRequestId(codeChallenge: string): Promise<{ authRequestId: string; state: string }> {
  const state = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });

  const url = `${API_BASE}/oauth/authorize?${params}`;
  console.log('[Auth] Step 1 →', url);
  const res = await fetch(url);
  const body = await res.text();
  console.log('[Auth] Step 1 ←', res.status, body);
  if (!res.ok) throw new Error(`Authorize failed ${res.status}: ${body}`);

  const json = JSON.parse(body);
  if (!json.auth_request_id) throw new Error('Missing auth_request_id in response');
  return { authRequestId: json.auth_request_id as string, state };
}

/**
 * Step 2: POST /oauth/login → 302 redirect with ?code=...
 *
 * Uses XMLHttpRequest so we can read responseURL after the redirect
 * is followed. The server redirects to REDIRECT_URI?code=XXX — we
 * parse the code from that URL without caring about the destination's
 * HTTP response.
 */
function extractCodeFromUrl(url: string): string | null {
  try {
    // Handle both full URLs and just query strings
    const questionMark = url.indexOf('?');
    if (questionMark === -1) return null;
    const params = new URLSearchParams(url.slice(questionMark + 1));
    return params.get('code');
  } catch {
    return null;
  }
}

async function loginWithCredentials(
  authRequestId: string,
  username: string,
  password: string,
  expectedState: string
): Promise<string> {
  const loginBody = new URLSearchParams({
    auth_request_id: authRequestId,
    username,
    password,
    device_id: DEVICE_ID,
  }).toString();
  console.log('[Auth] Step 2 → POST /oauth/login', { authRequestId, username, device_id: DEVICE_ID });
  const res = await fetch(`${API_BASE}/oauth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: loginBody,
  });

  if (!res.ok) {
    const body = await res.text();
    console.log('[Auth] Step 2 ← ERROR', res.status, body);
    throw new Error(`Login failed ${res.status}: ${body}`);
  }

  const json = await res.json();

  // Verify state matches what we sent in Step 1 to prevent CSRF.
  // State may come back as json.state or in the redirect_uri query string.
  const redirectUri: string = json.redirect_uri ?? '';
  const returnedState =
    json.state ??
    new URLSearchParams(redirectUri.includes('?') ? redirectUri.split('?')[1] : '').get('state');
  if (returnedState && returnedState !== expectedState) {
    throw new Error('State mismatch — possible CSRF attack');
  }

  const code = json.code ?? extractCodeFromUrl(redirectUri);
  if (!code) throw new Error(`Login response missing code: ${JSON.stringify(json)}`);
  return code;
}

/** Step 3: POST /oauth/token (authorization_code) → TokenSet */
async function exchangeCode(
  code: string,
  codeVerifier: string
): Promise<TokenSet> {
  const res = await fetch(`${API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return parseTokenResponse(await res.json());
}

/** Step 4: POST /oauth/token (refresh_token) → new TokenSet */
async function refreshAccessToken(refreshToken: string): Promise<TokenSet> {
  const res = await fetch(`${API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  return parseTokenResponse(await res.json());
}

function parseTokenResponse(json: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}): TokenSet {
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    // subtract 60 s buffer so we refresh before actual expiry
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
  };
}

/* ------------------------------------------------------------------ */
/*  Token storage                                                       */
/* ------------------------------------------------------------------ */

export async function storeTokens(tokens: TokenSet): Promise<void> {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.accessToken, tokens.accessToken],
    [STORAGE_KEYS.refreshToken, tokens.refreshToken],
    [STORAGE_KEYS.expiresAt, String(tokens.expiresAt)],
  ]);
}

export async function loadTokens(): Promise<TokenSet | null> {
  const pairs = await AsyncStorage.multiGet([
    STORAGE_KEYS.accessToken,
    STORAGE_KEYS.refreshToken,
    STORAGE_KEYS.expiresAt,
  ]);

  const accessToken = pairs[0][1];
  const refreshToken = pairs[1][1];
  const expiresAt = pairs[2][1];

  if (!accessToken || !refreshToken || !expiresAt) return null;

  return {
    accessToken,
    refreshToken,
    expiresAt: Number(expiresAt),
  };
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.accessToken,
    STORAGE_KEYS.refreshToken,
    STORAGE_KEYS.expiresAt,
  ]);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

/** Full PKCE login flow. Returns stored TokenSet. */
export async function loginUser(
  username: string,
  password: string
): Promise<TokenSet> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const { authRequestId, state } = await getAuthRequestId(codeChallenge);
  const code = await loginWithCredentials(authRequestId, username, password, state);
  const tokens = await exchangeCode(code, codeVerifier);

  await storeTokens(tokens);
  return tokens;
}

/**
 * Returns a valid access token, refreshing transparently if within
 * the 60-second buffer window. Throws if no session exists.
 */
export async function getValidAccessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens) throw new Error('Not authenticated');

  if (Date.now() < tokens.expiresAt) {
    return tokens.accessToken;
  }

  // Token expired — refresh
  const fresh = await refreshAccessToken(tokens.refreshToken);
  await storeTokens(fresh);
  return fresh.accessToken;
}
