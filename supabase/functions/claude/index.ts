// Supabase Edge Function — Claude API proxy
// Deployed at: /functions/v1/claude
// Auth: requires valid Supabase JWT (user must be signed in)
// Set ANTHROPIC_API_KEY in Supabase Dashboard → Settings → Edge Functions → Secrets

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';

// TEMP: grant Pro to all users until RevenueCat is configured for production.
// Flip to false and remove before gating launch.
const GRANT_ALL_PRO = true;

// Per-user monthly token budget (input + output combined) — backstop for all free features
const MONTHLY_TOKEN_BUDGET = 100_000;

// Free-tier monthly feature limits (reset on the 1st of each month)
const FREE_MONTHLY_LIMITS: Record<string, number> = {
  target_analysis: 5,
  target_coach: 5,   // counted toward same display bucket as target_analysis
  narrative: 5,
};

// Features hard-blocked for free users (0 uses — show upgrade modal)
const FREE_BLOCKED_FEATURES = new Set([
  'assistant',
  'ammo_scan',
  'grade_a_gun',
  'video_analysis',
]);

// Daily rate limits per feature per tier (reset at midnight UTC)
// Pro users get the 'pro' limit; Premium users get the 'premium' limit.
// 0 = blocked for that tier.
const DAILY_LIMITS: Record<string, { pro: number; premium: number }> = {
  assistant:       { pro: 25,  premium: 50  },
  ammo_scan:       { pro: 10,  premium: 25  },
  grade_a_gun:     { pro: 5,   premium: 15  },
  video_analysis:  { pro: 0,   premium: 10  },
};

interface RequestBody {
  messages: Array<{ role: string; content: unknown }>;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  feature?: string;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Missing Authorization header' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return json({ error: 'Unauthorized', detail: authError?.message ?? 'no user', tokenPrefix: token.slice(0, 20) }, 401);
  }

  // ── Parse request body ───────────────────────────────────────────────────────
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { messages, systemPrompt, model = DEFAULT_MODEL, maxTokens = 1024, feature = 'unknown' } = body;

  if (!messages?.length) {
    return json({ error: 'messages is required' }, 400);
  }

  // ── Check tier ───────────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_pro, pro_expires_at, is_premium, premium_expires_at')
    .eq('user_id', user.id)
    .single();

  const now = new Date();
  const isPremium = profile?.is_premium === true &&
    (!profile.premium_expires_at || new Date(profile.premium_expires_at) > now);
  const isPro = GRANT_ALL_PRO || isPremium || (
    profile?.is_pro === true &&
    (!profile.pro_expires_at || new Date(profile.pro_expires_at) > now)
  );

  // ── Free-user gates ──────────────────────────────────────────────────────────
  if (!isPro) {
    // Hard block — zero uses for free users
    if (FREE_BLOCKED_FEATURES.has(feature)) {
      return json({ error: 'feature_limit_exceeded', feature, message: 'This feature requires Pro.' }, 402);
    }

    // Monthly feature limits
    if (feature in FREE_MONTHLY_LIMITS) {
      const limit = FREE_MONTHLY_LIMITS[feature];
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // target_analysis and target_coach share the same display bucket
      const countFeatures = (feature === 'target_analysis' || feature === 'target_coach')
        ? ['target_analysis', 'target_coach']
        : [feature];

      const { count } = await supabase
        .from('ai_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('feature', countFeatures)
        .gte('created_at', startOfMonth.toISOString());

      if ((count ?? 0) >= limit) {
        return json({
          error: 'feature_limit_exceeded',
          feature,
          message: 'Monthly limit reached for this feature.',
        }, 402);
      }
    }

    // Monthly token budget backstop (all remaining free features)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usageRows } = await supabase
      .from('ai_usage')
      .select('input_tokens, output_tokens')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    const tokensUsed = (usageRows ?? []).reduce(
      (sum: number, row: { input_tokens: number; output_tokens: number }) =>
        sum + row.input_tokens + row.output_tokens,
      0
    );

    if (tokensUsed >= MONTHLY_TOKEN_BUDGET) {
      return json({ error: 'budget_exceeded', message: 'Monthly AI usage limit reached. Resets on the 1st.' }, 429);
    }
  }

  // ── Pro/Premium daily rate limits ────────────────────────────────────────────
  if (isPro && feature in DAILY_LIMITS) {
    const limits = DAILY_LIMITS[feature];
    const dailyLimit = isPremium ? limits.premium : limits.pro;

    // 0 means blocked for this tier
    if (dailyLimit === 0) {
      return json({
        error: 'feature_limit_exceeded',
        feature,
        message: isPremium
          ? 'This feature is not available on your plan.'
          : 'This feature requires Premium.',
      }, 402);
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('feature', feature)
      .gte('created_at', startOfDay.toISOString());

    if ((count ?? 0) >= dailyLimit) {
      return json({
        error: 'feature_limit_exceeded',
        feature,
        message: `Daily limit reached for this feature. Resets at midnight UTC.`,
        dailyLimit,
        tier: isPremium ? 'premium' : 'pro',
      }, 402);
    }
  }

  // ── Call Anthropic ───────────────────────────────────────────────────────────
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) {
    return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
  }

  const anthropicBody: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages,
  };
  if (systemPrompt) anthropicBody.system = systemPrompt;

  const anthropicRes = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(anthropicBody),
  });

  const anthropicData = await anthropicRes.json();

  if (!anthropicRes.ok) {
    console.error('Anthropic error:', anthropicData);
    return json({ error: 'AI service error', detail: anthropicData }, anthropicRes.status);
  }

  const text = anthropicData.content?.[0]?.text ?? '';
  const inputTokens = anthropicData.usage?.input_tokens ?? 0;
  const outputTokens = anthropicData.usage?.output_tokens ?? 0;

  // ── Log usage (non-blocking) ─────────────────────────────────────────────────
  supabase.from('ai_usage').insert({
    user_id: user.id,
    feature,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    model,
  }).then(() => {});

  return json({ text, usage: { inputTokens, outputTokens } });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
