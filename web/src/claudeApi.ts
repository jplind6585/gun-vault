// Claude API — routed through Supabase Edge Function (production-safe)
// Your Anthropic key lives in Supabase secrets, never in the browser.
import type { Session, Gun, AmmoLot, TargetPhotoAnalysis } from './types';
import { supabase, SUPABASE_URL } from './lib/supabase';

const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/claude`;

// Keep these for DevToolbar display only — key is no longer used for API calls
const KEY_STORAGE = 'gunvault_claude_key';
export function getClaudeApiKey(): string { return localStorage.getItem(KEY_STORAGE) || ''; }
export function setClaudeApiKey(key: string): void { localStorage.setItem(KEY_STORAGE, key.trim()); }
export function hasClaudeApiKey(): boolean { return true; } // always true — key is in Edge Function

async function callClaude(
  messages: object[],
  systemPrompt?: string,
  feature = 'unknown',
  maxTokens = 1024,
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sign in to use AI features.');

  const res = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ messages, systemPrompt, feature, maxTokens }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `AI error ${res.status}`);
  }

  const data = await res.json();
  return data.text ?? '';
}

// ── Session narrative ─────────────────────────────────────────────────────────

export async function generateSessionNarrative(
  session: Session,
  gun: Gun,
  ammoLot?: AmmoLot | null
): Promise<string> {
  const ammoDesc = ammoLot
    ? `${ammoLot.brand} ${ammoLot.productLine} ${ammoLot.grainWeight}gr`
    : 'unknown ammo';

  const issueText = session.issueTypes?.length
    ? `Issues: ${session.issueTypes.join(', ')}.`
    : 'No issues.';

  const prompt = `Write a single concise sentence (under 20 words) summarizing this range session. Tone: neutral, factual, like a logbook entry.

Gun: ${gun.make} ${gun.model} (${gun.caliber})
Date: ${session.date}
Rounds: ${session.roundsExpended}
Ammo: ${ammoDesc}
Location: ${session.location || 'unspecified'}
Environment: ${session.indoorOutdoor || 'unspecified'}
Distance: ${session.distanceYards ? session.distanceYards + ' yards' : 'unspecified'}
Purpose: ${session.purpose?.join(', ') || 'general'}
${issueText}
${session.notes ? 'Notes: ' + session.notes : ''}

Return only the sentence, no quotes.`;

  return callClaude([{ role: 'user', content: prompt }], undefined, 'narrative', 256);
}

// ── Target photo analysis ────────────────────────────────────────────────────

export async function analyzeTargetPhoto(
  imageBase64: string,
  context: {
    gun: Gun;
    distanceYards?: number;
    roundsExpended?: number;
    ammoLot?: AmmoLot | null;
  }
): Promise<TargetPhotoAnalysis> {
  const { gun, distanceYards, roundsExpended, ammoLot } = context;

  const systemPrompt = `You are an expert firearms instructor and ballistics analyst reviewing target photos.
Provide precise, actionable analysis. Be direct and specific — not generic.
If you see a pattern that suggests a mechanical issue (barrel wear, timing problem, loose optic), flag it clearly.
Format your response as JSON.`;

  const userPrompt = `Analyze this shooting target.

Context:
- Firearm: ${gun.make} ${gun.model} (${gun.caliber}, ${gun.action})
- Distance: ${distanceYards ? distanceYards + ' yards' : 'unknown'}
- Rounds on target: ${roundsExpended || 'unknown'}
- Ammo: ${ammoLot ? `${ammoLot.brand} ${ammoLot.grainWeight}gr ${ammoLot.bulletType}` : 'unknown'}

Return a JSON object with these fields:
{
  "groupSize": "estimated group size e.g. '3-inch group' or 'scattered 8 inches'",
  "accuracy": "accuracy assessment e.g. '~4 MOA', 'sub-MOA', 'minute of paper'",
  "pattern": "describe the shot distribution pattern — where shots are clustering, any bias",
  "issues": ["list of technique or equipment issues evident from the pattern, empty array if none"],
  "recommendations": ["specific actionable improvements for the shooter"],
  "drills": ["2-3 specific drills to address what you see"],
  "ammoNotes": "any observations relevant to this ammo's performance, or null",
  "equipmentWarnings": ["any patterns suggesting equipment issues like barrel wear, loose sights, trigger problems — empty array if none"]
}

Only return valid JSON, no other text.`;

  const raw = await callClaude(
    [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
              data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
            },
          },
          { type: 'text', text: userPrompt },
        ],
      },
    ],
    systemPrompt,
    'target_photo',
    1024,
  );

  try {
    const parsed = JSON.parse(raw);
    return { ...parsed, rawResponse: raw, analyzedAt: new Date().toISOString() };
  } catch {
    // Fallback if JSON parse fails
    return {
      pattern: raw,
      rawResponse: raw,
      analyzedAt: new Date().toISOString(),
    };
  }
}

// ── Ammo box scan ────────────────────────────────────────────────────────────

export interface AmmoBoxScanResult {
  caliber?: string;
  brand?: string;
  productLine?: string;
  grainWeight?: number;
  bulletType?: string;
  quantity?: number;
}

export async function analyzeAmmoBox(imageBase64: string): Promise<AmmoBoxScanResult> {
  const systemPrompt = `You are an expert at reading ammunition box labels. Extract structured data from ammo box images. Return only valid JSON.`;

  const userPrompt = `Read this ammunition box and extract the following fields. Return a JSON object:
{
  "caliber": "e.g. '9mm Luger', '.308 Winchester', '5.56x45mm NATO' — exact caliber as printed",
  "brand": "manufacturer name e.g. 'Federal', 'Hornady', 'Winchester'",
  "productLine": "product line / series e.g. 'HST', 'Critical Defense', 'Gold Dot' — or null if not visible",
  "grainWeight": 124,
  "bulletType": "e.g. 'JHP', 'FMJ', 'SP', 'TMJ', 'HP' — abbreviation preferred",
  "quantity": 50
}
Use null for any field you cannot read clearly. Return only the JSON object.`;

  const raw = await callClaude(
    [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
              data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
            },
          },
          { type: 'text', text: userPrompt },
        ],
      },
    ],
    systemPrompt,
    'ammo_scan',
    512,
  );

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ── Maintenance alerts ───────────────────────────────────────────────────────

export function getMaintenanceAlerts(
  guns: Gun[],
  sessions: Session[]
): Array<{ gun: Gun; roundsSinceClean: number; message: string }> {
  const alerts: Array<{ gun: Gun; roundsSinceClean: number; message: string }> = [];

  // Thresholds by gun type/action
  function threshold(gun: Gun): number {
    if (gun.action === 'Semi-Auto' && gun.type === 'Pistol') return 500;
    if (gun.action === 'Revolver') return 300;
    if (gun.type === 'Rifle') return 500;
    if (gun.type === 'Shotgun') return 250;
    return 500;
  }

  guns.forEach(gun => {
    const lastCleanCount = gun.lastCleanedRoundCount ?? 0;
    const currentCount = gun.roundCount ?? 0;
    const sinceClean = currentCount - lastCleanCount;
    const thresh = threshold(gun);

    if (sinceClean >= thresh) {
      alerts.push({
        gun,
        roundsSinceClean: sinceClean,
        message: `${sinceClean.toLocaleString()} rounds since last cleaning (threshold: ${thresh})`,
      });
    }
  });

  return alerts.sort((a, b) => b.roundsSinceClean - a.roundsSinceClean);
}

// ── Ammo performance correlation ─────────────────────────────────────────────

export function getAmmoCorrelation(
  sessions: Session[],
  ammoLots: AmmoLot[],
  guns: Gun[]
): Array<{
  gunId: string;
  gunName: string;
  ammoId: string;
  ammoName: string;
  sessions: number;
  issueRate: number;
  issueTypes: string[];
  recommendation?: string;
}> {
  const results: ReturnType<typeof getAmmoCorrelation> = [];
  const ammoMap = new Map(ammoLots.map(a => [a.id, a]));
  const gunMap = new Map(guns.map(g => [g.id, g]));

  // Group sessions by gun + ammo combination
  const groups = new Map<string, Session[]>();
  sessions.forEach(s => {
    if (!s.ammoLotId) return;
    const key = `${s.gunId}::${s.ammoLotId}`;
    const arr = groups.get(key) || [];
    arr.push(s);
    groups.set(key, arr);
  });

  groups.forEach((groupSessions, key) => {
    if (groupSessions.length < 3) return; // Need enough data
    const [gunId, ammoId] = key.split('::');
    const gun = gunMap.get(gunId);
    const ammo = ammoMap.get(ammoId);
    if (!gun || !ammo) return;

    const withIssues = groupSessions.filter(s => s.issues);
    const issueRate = withIssues.length / groupSessions.length;
    const allIssueTypes = withIssues.flatMap(s => s.issueTypes || []);
    const uniqueIssues = [...new Set(allIssueTypes)];

    let recommendation: string | undefined;
    if (issueRate > 0.3) {
      recommendation = `High issue rate (${Math.round(issueRate * 100)}%) with this ammo in this gun. Consider switching.`;
    } else if (issueRate === 0 && groupSessions.length >= 5) {
      recommendation = `Zero issues across ${groupSessions.length} sessions. Reliable combination.`;
    }

    results.push({
      gunId,
      gunName: `${gun.make} ${gun.model}`,
      ammoId,
      ammoName: `${ammo.brand} ${ammo.productLine} ${ammo.grainWeight}gr`,
      sessions: groupSessions.length,
      issueRate,
      issueTypes: uniqueIssues,
      recommendation,
    });
  });

  return results.sort((a, b) => b.issueRate - a.issueRate);
}

// ── Target coaching ──────────────────────────────────────────────────────────

export async function callTargetCoach(
  statsContext: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const systemPrompt = `You are an expert firearms instructor and precision shooting coach. \
You analyze shot group data and give specific, actionable feedback. \
Keep responses to 3-4 sentences max per insight. Be direct and specific — not generic. \
Format: zero correction first, then group diagnosis, then one next step.`;

  const anthropicMessages = messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.role === 'user' && messages.indexOf(m) === 0
      ? `Shot group data:\n${statsContext}\n\n${m.content}`
      : m.content,
  }));

  return callClaude(anthropicMessages, systemPrompt, 'target_coach', 512);
}

// ── Armory Assistant ─────────────────────────────────────────────────────────

const ASSISTANT_SYSTEM_PROMPT = `You are the Lindcott Armory AI — a knowledgeable, straight-talking firearms assistant with full access to this user's personal vault data.

CAPABILITIES:
- Answer questions about firearms, cartridges, ammunition, optics, and ballistics
- Analyze the user's personal vault data and give specific, personalized insights
- Help with maintenance planning, ammo selection, and range performance
- Explain historical and technical context for any firearm or cartridge
- Assist with training planning and drill selection

HARD LIMITS — never provide guidance on:
- Converting semi-automatic firearms to fire automatically
- Manufacturing, modifying, or acquiring NFA items (suppressors, SBR/SBS, destructive devices, machine guns) outside legal channels
- Defeating federal, state, or local background check or transfer requirements
- Illegal modifications of any kind in any jurisdiction
- Methods to defeat firearm safety mechanisms for harmful purposes

If a question touches these areas, briefly explain you can't help with that and suggest consulting a licensed FFL dealer or firearms attorney. Then move on.

TONE: Direct and practical — like a trusted gunsmith or experienced range instructor. Not preachy. Answer the question.`;

export function buildVaultContext(guns: Gun[], sessions: Session[], ammoLots: AmmoLot[]): string {
  const lines: string[] = [`VAULT CONTEXT (${new Date().toLocaleDateString()}):\n`];

  // Guns
  lines.push(`FIREARMS (${guns.length} total):`);
  guns.forEach(g => {
    const cleaning = g.lastCleanedRoundCount != null && g.roundCount != null
      ? `, ${g.roundCount - g.lastCleanedRoundCount} rounds since last cleaning`
      : '';
    lines.push(`  - ${g.make} ${g.model} (${g.caliber}, ${g.type}) — ${g.roundCount ?? 0} total rounds${cleaning}`);
  });

  // Ammo
  const ammoByCalibер = ammoLots.reduce<Record<string, number>>((acc, lot) => {
    acc[lot.caliber] = (acc[lot.caliber] ?? 0) + (lot.quantity ?? 0);
    return acc;
  }, {});
  const ammoEntries = Object.entries(ammoByCalibер).sort((a, b) => b[1] - a[1]);
  lines.push(`\nAMMO INVENTORY (${ammoLots.length} lots, ${Object.values(ammoByCalibер).reduce((a, b) => a + b, 0)} total rounds):`);
  ammoEntries.forEach(([caliber, qty]) => lines.push(`  - ${caliber}: ${qty} rounds`));

  // Recent sessions
  const recent = [...sessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);
  lines.push(`\nRECENT SESSIONS (last ${recent.length}):`);
  recent.forEach(s => {
    const gunName = guns.find(g => g.id === s.gunId);
    const label = gunName ? `${gunName.make} ${gunName.model}` : 'Unknown gun';
    const issues = s.issues ? ` — issues: ${s.issueTypes?.join(', ') || 'yes'}` : '';
    lines.push(`  - ${s.date}: ${label} | ${s.roundsExpended} rounds | ${s.purpose?.join(', ') || 'general'}${issues}`);
  });

  return lines.join('\n');
}

export async function callArmoryAssistant(
  vaultContext: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
): Promise<string> {
  const systemPrompt = `${ASSISTANT_SYSTEM_PROMPT}\n\n${vaultContext}`;
  return callClaude(
    messages.map(m => ({ role: m.role, content: m.content })),
    systemPrompt,
    'assistant',
    1024,
  );
}

// ── Training gap ─────────────────────────────────────────────────────────────

export function getTrainingGapDays(sessions: Session[]): number {
  if (sessions.length === 0) return Infinity;
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const lastDate = new Date(sorted[0].date + 'T12:00:00');
  const today = new Date();
  return Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
}
