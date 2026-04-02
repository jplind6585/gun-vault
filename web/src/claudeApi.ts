// Claude API — direct browser integration (personal app)
// User's API key stored in localStorage; calls include required dangerous-direct-browser header
import type { Session, Gun, AmmoLot, TargetPhotoAnalysis } from './types';

const KEY_STORAGE = 'gunvault_claude_key';
const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-4-6';

export function getClaudeApiKey(): string {
  return localStorage.getItem(KEY_STORAGE) || '';
}

export function setClaudeApiKey(key: string): void {
  localStorage.setItem(KEY_STORAGE, key.trim());
}

export function hasClaudeApiKey(): boolean {
  return !!getClaudeApiKey();
}

async function callClaude(messages: object[], systemPrompt?: string): Promise<string> {
  const key = getClaudeApiKey();
  if (!key) throw new Error('No Claude API key set. Add it in Settings.');

  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: 1024,
    messages,
  };
  if (systemPrompt) body.system = systemPrompt;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
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

  return callClaude([{ role: 'user', content: prompt }]);
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
    systemPrompt
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
    systemPrompt
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

  return callClaude(anthropicMessages, systemPrompt);
}

// ── Training gap ─────────────────────────────────────────────────────────────

export function getTrainingGapDays(sessions: Session[]): number {
  if (sessions.length === 0) return Infinity;
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const lastDate = new Date(sorted[0].date + 'T12:00:00');
  const today = new Date();
  return Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
}
