// Supabase Edge Function — Claude API proxy
// Deployed at: /functions/v1/claude
// Auth: requires valid Supabase JWT (user must be signed in)
// Set ANTHROPIC_API_KEY in Supabase Dashboard → Settings → Edge Functions → Secrets

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';

// Per-user monthly token budget (input + output combined)
// Adjust based on your pricing tier
const MONTHLY_TOKEN_BUDGET = 100_000;

interface RequestBody {
  messages: Array<{ role: string; content: unknown }>;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  feature?: string; // for usage tracking: 'narrative' | 'target_analysis' | 'progress' | etc.
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
    return json({ error: 'Unauthorized' }, 401);
  }

  // ── Monthly usage check ──────────────────────────────────────────────────────
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
    return json({ error: 'Monthly AI usage limit reached. Resets on the 1st.' }, 429);
  }

  // ── Parse request ────────────────────────────────────────────────────────────
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
