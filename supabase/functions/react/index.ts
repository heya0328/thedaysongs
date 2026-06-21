// Supabase Edge Function: `react`
// - Validates the emoji key and anonymous user id
// - Runs the atomic rate-limit RPC `try_send_reaction`
// - Records unique reaction per user per track
// - On success, broadcasts the reaction to channel `reactions:global`
//
// Deploy:  supabase functions deploy react --no-verify-jwt

import { createClient } from 'jsr:@supabase/supabase-js@2';

const ALLOWED_KEYS = new Set([
  'red-heart',
  'fire',
  'heart-eyes',
  'party',
  'clap',
]);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

type RpcResult = { ok: boolean; reason?: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ ok: false, reason: 'method_not_allowed' }, 405);
  }

  let body: { key?: unknown; userId?: unknown; trackId?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, reason: 'bad_request' }, 400);
  }

  const key = typeof body.key === 'string' ? body.key : null;
  const userId = typeof body.userId === 'string' ? body.userId : null;
  const trackId = typeof body.trackId === 'string' ? body.trackId : null;

  if (!key || !ALLOWED_KEYS.has(key)) {
    return json({ ok: false, reason: 'invalid_key' }, 400);
  }
  if (!userId || userId.length < 8 || userId.length > 64) {
    return json({ ok: false, reason: 'invalid_user' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ ok: false, reason: 'misconfigured' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Rate limit check
  const { data, error } = await supabase.rpc('try_send_reaction', {
    p_user_id: userId,
  });
  if (error) {
    return json({ ok: false, reason: 'db_error' }, 500);
  }
  const result = data as RpcResult | null;
  if (!result?.ok) {
    return json({ ok: false, reason: result?.reason ?? 'rate_limited' }, 429);
  }

  // Record unique reaction (유저당 트랙당 1개, 중복 무시)
  if (trackId) {
    await supabase.rpc('record_reaction', {
      p_track_id: trackId,
      p_user_id: userId,
    });
  }

  // Broadcast
  const broadcastRes = await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      messages: [
        {
          topic: 'reactions:global',
          event: 'reaction',
          payload: { key, senderId: userId },
        },
      ],
    }),
  });
  if (!broadcastRes.ok) {
    return json({ ok: false, reason: 'broadcast_failed' }, 502);
  }

  return json({ ok: true });
});
