// Supabase Edge Function — Activate Pro
// POST /functions/v1/claim-pro
// Auth: requires valid Supabase JWT
// Body (optional): { source: 'google_play' | 'early_access', tier?: 'pro' | 'premium' }
//
// - google_play: paid subscription confirmed by RevenueCat on device.
//   Sets is_pro=true with no expiry (subscription managed by Play).
// - early_access (default): free 30-day claim. One per user.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return json(null, 200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type',
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  // Parse source and tier from body
  let source: string = 'early_access';
  let tier: string = 'pro';
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.source) source = body.source;
    if (body?.tier === 'premium') tier = 'premium';
  } catch { /* no body */ }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('early_access_claimed_at, is_pro')
    .eq('user_id', user.id)
    .single();

  // ── Google Play paid subscription ────────────────────────────────────────
  if (source === 'google_play') {
    // Managed by Play Store — no expiry set here (RevenueCat webhook handles renewal/cancellation)
    const upsertPayload: Record<string, unknown> = {
      user_id: user.id,
      is_pro: true,
      pro_expires_at: null,
      subscription_source: 'google_play',
    };
    if (tier === 'premium') {
      upsertPayload.is_premium = true;
      upsertPayload.premium_expires_at = null;
    }

    const { error: upsertError } = await supabase
      .from('user_profiles')
      .upsert(upsertPayload, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('upsert error:', upsertError);
      return json({ error: 'Failed to activate. Please try again.' }, 500);
    }
    return json({ success: true });
  }

  // ── Early access free month ───────────────────────────────────────────────
  if (profile?.early_access_claimed_at) {
    return json({
      error: 'already_claimed',
      message: 'You have already claimed your free Pro month.',
    }, 400);
  }

  const proExpiresAt = new Date();
  proExpiresAt.setDate(proExpiresAt.getDate() + 30);

  const { error: upsertError } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      is_pro: true,
      pro_expires_at: proExpiresAt.toISOString(),
      early_access_claimed_at: new Date().toISOString(),
      subscription_source: 'early_access',
    }, { onConflict: 'user_id' });

  if (upsertError) {
    console.error('upsert error:', upsertError);
    return json({ error: 'Failed to activate Pro. Please try again.' }, 500);
  }

  return json({ success: true, pro_expires_at: proExpiresAt.toISOString() });
});

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });
}
