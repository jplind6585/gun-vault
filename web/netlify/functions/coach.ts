import type { Config, Context } from '@netlify/functions';

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'not_configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { statsContext?: string; messages?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const { statsContext = '', messages = [] } = body;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: [
        'You are a world-class precision rifle and pistol shooting coach.',
        'Analyze shot group statistics and give specific, actionable advice.',
        'Be concise: 2–3 bullet points max per response.',
        'Focus on the single most impactful improvement the shooter can make.',
        statsContext ? `\nCurrent shot group data:\n${statsContext}` : '',
      ].join('\n').trim(),
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(JSON.stringify({ error: err }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await response.json() as { content?: { text: string }[] };
  const reply = data.content?.[0]?.text ?? 'No response generated.';

  return new Response(JSON.stringify({ reply }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config: Config = { path: '/api/coach' };
