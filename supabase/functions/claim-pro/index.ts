// Supabase Edge Function — Claim Early Access Pro Month
// POST /functions/v1/claim-pro
// Auth: requires valid Supabase JWT
// Sets is_pro=true and pro_expires_at=now()+30days for the authenticated user.
// Can only be claimed once per user (enforced server-side).

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

  // Check if already claimed
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('early_access_claimed_at, is_pro')
    .eq('user_id', user.id)
    .single();

  if (profile?.early_access_claimed_at) {
    return json({
      error: 'already_claimed',
      message: 'You have already claimed your free Pro month.',
      pro_expires_at: null,
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
