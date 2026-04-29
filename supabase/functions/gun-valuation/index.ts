// Gun Valuation Edge Function
// Deployed at: /functions/v1/gun-valuation
// Auth: requires valid Supabase JWT
//
// Current engine: Claude AI (training-data market knowledge)
// Future engine: swap in GunBroker or Blue Book when API access is confirmed
//   - GunBroker DevKey pending approval (~2 weeks) — see GUNBROKER_DEV_KEY secret
//   - Blue Book API: check bluebookofgunvalues.com for developer access
//
// Secrets needed: none currently (uses ANTHROPIC_API_KEY from claude function)
// When GunBroker is approved: add GUNBROKER_DEV_KEY secret

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Content-Type': 'application/json',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (!req.headers.get('Authorization')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) {
    return json({ error: 'Anthropic API key not configured' }, 503);
  }

  let make = '', model = '', caliber = '', condition = 'Very Good', keywords = '';
  try {
    const body = await req.json();
    make      = body.make      || '';
    model     = body.model     || '';
    caliber   = body.caliber   || '';
    condition = body.condition || 'Very Good';
    keywords  = body.keywords  || '';
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const subject = keywords || [make, model, caliber].filter(Boolean).join(' ');
  if (!subject.trim()) {
    return json({ error: 'No firearm details provided' }, 400);
  }

  const prompt = `You are a firearms market valuation expert with deep knowledge of current US gun market prices.

Estimate the current fair market value (FMV) for this firearm:
- Make/Model: ${make ? `${make} ${model}` : subject}
${caliber ? `- Caliber: ${caliber}` : ''}
- Condition: ${condition}

Respond with ONLY a JSON object in this exact format, no other text:
{
  "low": <number>,
  "high": <number>,
  "median": <number>,
  "confidence": "high" | "medium" | "low",
  "notes": "<one sentence about what drives this value or any important caveats>"
}

Rules:
- Base values on realistic current US private-party / used gun dealer market prices
- Apply condition correctly: New=full retail, Excellent=~90%, Very Good=~80%, Good=~70%, Fair=~55%, Poor=~40%
- low should be ~10% below median, high ~10% above median
- If the firearm is obscure or your confidence is low, say so in notes and widen the range
- Do NOT include dollar signs or commas in the numbers — plain integers only
- If you genuinely cannot estimate (e.g. completely unknown firearm), return confidence "low" with a wide range and explain in notes`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      console.error('Anthropic error:', res.status, err);
      return json({ error: `AI API error ${res.status}` }, 502);
    }

    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? '';

    let parsed: { low: number; high: number; median: number; confidence: string; notes: string };
    try {
      // Strip any markdown code fences if present
      const clean = text.replace(/```[a-z]*\n?/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      console.error('Failed to parse Claude response:', text);
      return json({ error: 'Failed to parse valuation response', raw: text }, 500);
    }

    return json({
      low:       Math.round(parsed.low),
      high:      Math.round(parsed.high),
      median:    Math.round(parsed.median),
      confidence: parsed.confidence,
      notes:     parsed.notes,
      condition,
      subject,
      source:    'claude',
      timestamp: new Date().toISOString(),
    });

  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      return json({ error: 'Valuation request timed out' }, 504);
    }
    return json({ error: err.message }, 500);
  }
});
