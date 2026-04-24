// Claude API — routed through Supabase Edge Function (production-safe)
// Your Anthropic key lives in Supabase secrets, never in the browser.
import type { Session, Gun, AmmoLot, TargetPhotoAnalysis, SessionPurpose, IssueType } from './types';
import type { ShooterProfile } from './shooterProfile';
import type { CheckInTrigger } from './profileInference';
import { supabase, SUPABASE_URL } from './lib/supabase';

const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/claude`;

// Keep these for DevToolbar display only — key is no longer used for API calls
const KEY_STORAGE = 'gunvault_claude_key';
export function getClaudeApiKey(): string { return localStorage.getItem(KEY_STORAGE) || ''; }
export function setClaudeApiKey(key: string): void { localStorage.setItem(KEY_STORAGE, key.trim()); }
export function hasClaudeApiKey(): boolean { return true; } // always true — key is in Edge Function

// ── Usage cache (localStorage mirror — display only, not enforcement) ─────────

interface UsageCache {
  month: string; // 'YYYY-MM'
  target_analysis_count: number;
  narrative_count: number;
}

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getUsageCache(): UsageCache {
  const month = getCurrentMonth();
  try {
    const stored = localStorage.getItem('ai_usage_cache');
    if (!stored) return { month, target_analysis_count: 0, narrative_count: 0 };
    const parsed: UsageCache = JSON.parse(stored);
    if (parsed.month !== month) return { month, target_analysis_count: 0, narrative_count: 0 };
    return parsed;
  } catch {
    return { month, target_analysis_count: 0, narrative_count: 0 };
  }
}

function incrementUsageCache(feature: string): void {
  const cache = getUsageCache();
  if (feature === 'target_analysis' || feature === 'target_coach') {
    cache.target_analysis_count += 1;
  } else if (feature === 'narrative') {
    cache.narrative_count += 1;
  }
  localStorage.setItem('ai_usage_cache', JSON.stringify(cache));
}

/** Read current month's free-tier usage counts for display in UI. */
export function getFeatureUsageCounts(): { targetAnalysis: number; narrative: number } {
  const cache = getUsageCache();
  return { targetAnalysis: cache.target_analysis_count, narrative: cache.narrative_count };
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  } catch { /* ignore */ }
  // Fallback: force a refresh, then try again
  try {
    const { data } = await supabase.auth.refreshSession();
    if (data.session?.access_token) return data.session.access_token;
  } catch { /* ignore */ }
  return null;
}

async function callClaude(
  messages: object[],
  systemPrompt?: string,
  feature = 'unknown',
  maxTokens = 1024,
): Promise<string> {
  let accessToken = await getAccessToken();
  if (!accessToken) throw new Error('Sign in to use AI features.');

  const doFetch = (token: string) => fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ messages, systemPrompt, feature, maxTokens }),
  });

  let res = await doFetch(accessToken);

  // On 401, force-refresh the session once and retry — handles stale tokens after long idle
  if (res.status === 401) {
    try {
      const { data } = await supabase.auth.refreshSession();
      const fresh = data.session?.access_token;
      if (fresh) res = await doFetch(fresh);
    } catch { /* fall through to error handling below */ }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    if (res.status === 429 || err.error === 'budget_exceeded') {
      window.dispatchEvent(new CustomEvent('ai_budget_exceeded'));
      throw new Error('BUDGET_EXCEEDED');
    }
    if (res.status === 402 && err.error === 'feature_limit_exceeded') {
      const reason = (err.feature === 'narrative') ? 'narrative_limit' : 'target_analysis_limit';
      window.dispatchEvent(new CustomEvent('show_upgrade_modal', { detail: { reason } }));
      throw new Error(`FEATURE_LIMIT:${err.feature}`);
    }
    throw new Error(err.error ?? `AI error ${res.status}`);
  }

  const data = await res.json();
  incrementUsageCache(feature);
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
    // Claude sometimes wraps JSON in ```json ... ``` — strip it before parsing
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = match ? match[1].trim() : raw.trim();
    return JSON.parse(jsonStr);
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

export async function callGunPrecisionCoach(
  gunName: string,
  analysesContext: string
): Promise<string> {
  const systemPrompt = `You are an expert precision shooting coach analyzing long-term accuracy trends for a specific firearm. \
Review the shot group history and give a concise, specific assessment in 3-5 sentences. \
Cover: whether the gun is improving or degrading, what might explain the trend (fundamentals, hardware, ammo, maintenance), \
and one concrete action the shooter should take. Compare to typical patterns when relevant. Be direct — no filler.`;

  const messages = [{ role: 'user' as const, content: `Firearm: ${gunName}\n\n${analysesContext}\n\nProvide your precision trend analysis.` }];
  return callClaude(messages, systemPrompt, 'gun_precision_coach', 400);
}

// ── Armory Assistant ─────────────────────────────────────────────────────────

const ASSISTANT_SYSTEM_PROMPT = `You are the Lindcott Armory AI — a knowledgeable, straight-talking firearms assistant with full access to this user's personal vault data.

SCOPE — you are strictly limited to:
- The user's vault data: guns, ammo lots, optics, range sessions, and maintenance status
- Firearms knowledge: maintenance procedures, specifications, history, ballistics, cleaning, storage, safe handling, and ammo selection
- Reloading: component questions and load development concepts — always recommend consulting published load data, never substitute for it

If the user asks about anything outside this scope — including but not limited to: politics, news, general knowledge, coding, relationships, health, legal advice, financial advice, or any topic not directly related to firearms or their vault — respond only with:

"I'm scoped to your vault and firearms questions only."

Do not explain why you are refusing. Do not suggest alternatives. Do not elaborate. One sentence, then stop.

HARD LIMITS — refuse any request related to:
- Illegal weapon modifications (auto conversions, bump stocks, removing serial numbers, SBR/SBS without proper NFA registration, etc.)
- Circumventing background checks or legal transfer processes
- Any activity that would violate federal, state, or local law

For these requests, respond only with: "I can't help with that."

CAPABILITIES:
- Answer questions about firearms, cartridges, ammunition, optics, and ballistics
- Analyze the user's personal vault data and give specific, personalized insights
- Help with maintenance planning, ammo selection, and range performance
- Explain historical and technical context for any firearm or cartridge
- Assist with training planning and drill selection

TONE: Direct and practical — like a trusted gunsmith or experienced range instructor. Not preachy. Answer the question.`;

// Phase 1 intelligence extensions — appended to system prompt, never replaces the core guardrail block above.
const ASSISTANT_PHASE1_EXTENSIONS = `

PROACTIVE INTELLIGENCE GUIDELINES (append to every conversation):

MAINTENANCE (Feature 8): Beyond round count, factor in ammo type when assessing cleaning needs. Steel-case fouls roughly 2x faster than brass — note it if session data shows steel-case use. Suppressed use fouls 2-3x faster. Some calibers are inherently dirty (.22LR, steel-case 9mm, 5.56 carbines). Guns stored long-term need function checks regardless of round count.

PRE-SESSION PREP (Feature 3): When asked about an upcoming session, check from vault data: last zero date + distance, ammo inventory for that caliber, rounds since last cleaning, any open issues on the gun, optic assignment. Deliver a focused 4-6 point checklist — not a wall of text.

INVENTORY PROJECTION (Feature 5): When asked about ammo supply, compute from session history: sessions per month with that gun × avg rounds per session = burn rate. Current stock ÷ burn rate = time remaining. Give a specific timeline in both sessions and weeks. Flag multi-caliber shortage patterns proactively.

DEBRIEF PATTERN RECOGNITION (Feature 11): If the context includes ammo issue correlation data, act on it — don't wait to be asked. 3+ sessions, same gun, same ammo, same issue type → ammo problem. 3+ sessions, same gun, varied ammo, same issue type → gun or technique problem. Always offer one specific diagnostic next step.`;

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

// ── Full context (vault + shooter profile) ───────────────────────────────────

// ── Check-in probe ────────────────────────────────────────────────────────────
// Appended to the assistant system prompt when an active trigger is detected.
// The AI weaves the question in naturally — no popup, no separate UI.

const CHECK_IN_PROBE_INSTRUCTIONS: Record<Exclude<CheckInTrigger, 'none'>, string> = {
  session_count_milestone: `CHECK-IN ACTIVE: The user just hit a session milestone. At a natural point in your response — not as your opener — ask ONE brief question about whether their current goals are still on track. Example: "Is [goal] still your main focus right now, or has your direction shifted?" Don't announce it as a check-in. One question only.`,
  vault_growth: `CHECK-IN ACTIVE: The user has added several guns recently. At a natural point in your response, ask ONE question about where they're taking the collection or what role the new additions play. Keep it conversational. One question only.`,
  first_reload: `CHECK-IN ACTIVE: The user just started reloading. At a natural point in your response, ask ONE question about what drew them to it — precision, economics, or something else. Keep it brief and genuine. One question only.`,
  long_gap: `CHECK-IN ACTIVE: The user has had a significant gap since their last session. If it comes up naturally, briefly acknowledge it and ask one question about what's been happening — life stuff, shifted priorities, or just a busy stretch. Keep it light, not preachy. One question only.`,
};

export function buildCheckInProbe(trigger: CheckInTrigger): string {
  if (trigger === 'none') return '';
  return `\n\n${CHECK_IN_PROBE_INSTRUCTIONS[trigger]}`;
}

export function buildFullContext(
  guns: Gun[],
  sessions: Session[],
  ammoLots: AmmoLot[],
  profile: ShooterProfile | null,
): string {
  const vaultSection = buildVaultContext(guns, sessions, ammoLots);

  // Ammo correlation data for Feature 11 (session debrief pattern recognition)
  const correlations = getAmmoCorrelation(sessions, ammoLots, guns);
  const correlationSection = correlations.length > 0
    ? '\nAMMO ISSUE PATTERNS:\n' + correlations.map(c =>
        `  - ${c.gunName} + ${c.ammoName}: ${c.issueRate.toFixed(0)}% issue rate across ${c.sessions} sessions` +
        (c.issueTypes.length ? ` (${c.issueTypes.join(', ')})` : '') +
        (c.recommendation ? ` — ${c.recommendation}` : '')
      ).join('\n')
    : '';

  if (!profile) return vaultSection + correlationSection;

  const lines: string[] = [vaultSection, '\nSHOOTER PROFILE:'];

  // Top personas
  if (profile.primaryPersonas.length > 0) {
    const personas = profile.primaryPersonas
      .map(p => `${p.type.replace(/_/g, ' ')} (${Math.round(p.probability * 100)}%)`)
      .join(', ');
    lines.push(`  Persona: ${personas}`);
  }

  // Skills (only intermediate and above, sorted by level)
  const levelOrder: Record<string, number> = { expert: 4, advanced: 3, intermediate: 2, beginner: 1, none: 0 };
  const significantSkills = profile.skills
    .filter(s => s.level !== 'none' && s.level !== 'beginner')
    .sort((a, b) => (levelOrder[b.level] ?? 0) - (levelOrder[a.level] ?? 0))
    .slice(0, 8);

  if (significantSkills.length > 0) {
    lines.push('  Skills:');
    significantSkills.forEach(s => {
      const conf = s.confidence >= 0.7 ? '' : ' (inferred)';
      lines.push(`    - ${s.domain.replace(/_/g, ' ')}: ${s.level}${conf}`);
    });
  }

  // Active goals
  const activeGoals = profile.goals.filter(g => g.status === 'active');
  if (activeGoals.length > 0) {
    lines.push('  Active goals:');
    activeGoals.slice(0, 5).forEach(g => lines.push(`    - ${g.text}`));
  }

  // Accuracy highlights (high/medium confidence only)
  const confidentAccuracy = profile.accuracyProfiles
    .filter(p => p.confidence === 'high' || p.confidence === 'medium')
    .filter(p => p.medianMOA !== undefined);

  if (confidentAccuracy.length > 0) {
    lines.push('  Accuracy profiles:');
    confidentAccuracy.slice(0, 4).forEach(ap => {
      const gun = guns.find(g => g.id === ap.gunId);
      const name = gun ? `${gun.make} ${gun.model}` : ap.gunId;
      lines.push(`    - ${name}: ${ap.medianMOA?.toFixed(1)} MOA median (${ap.sessionCount} sessions, ${ap.confidence} confidence)`);
    });
  }

  // Training gap
  if (profile.daysSinceLastSession < 9999) {
    lines.push(`  Days since last session: ${profile.daysSinceLastSession}`);
  }

  return lines.join('\n') + correlationSection;
}

export async function callArmoryAssistant(
  vaultContext: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  checkInTrigger: CheckInTrigger = 'none',
): Promise<string> {
  const probe = buildCheckInProbe(checkInTrigger);
  const systemPrompt = `${ASSISTANT_SYSTEM_PROMPT}${ASSISTANT_PHASE1_EXTENSIONS}\n\n${vaultContext}${probe}`;
  return callClaude(
    messages.map(m => ({ role: m.role, content: m.content })),
    systemPrompt,
    'assistant',
    1024,
  );
}

// ── Onboarding conversation ───────────────────────────────────────────────────

const ONBOARDING_SYSTEM_PROMPT = `You are setting up a shooter profile for a Lindcott Armory user.
You have their vault data. Your job: ask 4–5 focused questions (one at a time) to learn their goals and experience. Then wrap up.

QUESTIONS TO COVER (adapt based on what you already know from vault data — skip anything obvious):
1. Experience: how long they've been shooting, how they got started
2. Primary discipline or focus right now
3. One skill they're actively working to improve
4. How often they get to the range
5. (Optional) Something coming up — a match, hunt, class, or purchase goal

RULES:
- One question per message. Never stack questions.
- Use vault data. If they have a PRS rifle, don't ask if they shoot long range — you already know.
- Be direct and warm. 2–4 sentences per message maximum.
- After 4–5 exchanges (minimum 3 questions answered), wrap up with a brief summary of what you've learned. End your wrap-up message with exactly this on its own line: PROFILE_READY
- Do not output PROFILE_READY before at least 3 questions have been answered.`;

export async function callOnboardingAssistant(
  vaultContext: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
): Promise<string> {
  const systemPrompt = `${ONBOARDING_SYSTEM_PROMPT}\n\n${vaultContext}`;
  return callClaude(
    messages.map(m => ({ role: m.role, content: m.content })),
    systemPrompt,
    'onboarding',
    512,
  );
}

export async function extractOnboardingGoals(
  vaultContext: string,
  conversation: { role: 'user' | 'assistant'; content: string }[],
): Promise<{ goals: string[]; notes: string }> {
  const systemPrompt = `${ONBOARDING_SYSTEM_PROMPT}\n\n${vaultContext}`;
  const extractionPrompt = `Based on the conversation above, extract the user's goals and key profile notes.
Return only valid JSON:
{
  "goals": ["specific goal 1", "specific goal 2"],
  "notes": "brief summary of shooter background, 1-2 sentences"
}
Goals should be specific, actionable, first-person statements. 2–4 goals max.`;

  const raw = await callClaude(
    [
      ...conversation.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: extractionPrompt },
    ],
    systemPrompt,
    'onboarding_extract',
    512,
  );

  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {
    // fall through
  }
  return { goals: [], notes: '' };
}

// ── Session AI Parser ─────────────────────────────────────────────────────────

export interface ParsedSessionString {
  gunId: string;
  roundsExpended: number;
  ammoLotId?: string;
  distanceYards?: number;
}

export interface ParsedSessionData {
  strings?: ParsedSessionString[];
  date?: string;
  location?: string;
  indoorOutdoor?: 'Indoor' | 'Outdoor';
  purpose?: SessionPurpose[];
  issues?: boolean;
  issueTypes?: IssueType[];
  issueDescription?: string;
  notes?: string;
}

export interface SessionParseResult {
  extracted: ParsedSessionData;
  message: string;
  done: boolean;
}

export async function parseSessionFromText(
  guns: Gun[],
  ammoLots: AmmoLot[],
  messages: { role: 'user' | 'assistant'; content: string }[],
): Promise<SessionParseResult> {
  const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

  const gunList = guns.length
    ? guns.map(g => `  - ID:${g.id} | ${g.displayName || `${g.make} ${g.model}`} | ${g.caliber} | ${g.type}`).join('\n')
    : '  (no firearms in vault)';

  const ammoList = ammoLots.length
    ? ammoLots.map(a => `  - ID:${a.id} | ${a.brand} ${a.productLine} ${a.grainWeight}gr ${a.caliber} | qty:${a.quantity}`).join('\n')
    : '  (no ammo in inventory)';

  const systemPrompt = `You are a session logging assistant for Lindcott Armory. Extract shooting session data from natural language.

TODAY: ${today}

USER'S FIREARMS:
${gunList}

USER'S AMMO INVENTORY:
${ammoList}

RESPONSE FORMAT — first line must be JSON, then a blank line, then your conversational reply:
{"extracted": {FIELDS}, "done": BOOLEAN}

Your reply here.

EXTRACTED FIELDS (only include what you've identified):
- strings: [{gunId, roundsExpended, ammoLotId?, distanceYards?}] — one per gun
- date: "MM/DD/YYYY" (default today)
- location: range/location name
- indoorOutdoor: "Indoor" or "Outdoor"
- purpose: ["Warmup","Drills","Zeroing","Qualification","Competition","Fun","Carry Eval"]
- issues: boolean
- issueTypes: ["FTF","FTE","Double Feed","Stovepipe","Trigger Reset","Accuracy","Sighting","Other"]
- issueDescription: detailed issue description
- notes: anything else

Set "done":true when you have at least one string with a matched gunId and roundsExpended.

RULES:
- Fuzzy match guns (e.g. "savage mkII"→Savage Mark II, "glock"→Glock if only one)
- Fuzzy match ammo (e.g. "CCI greendot"→CCI Green Dot)
- Multiple guns mentioned → multiple strings
- Default date to today if not specified
- Ask only about what's missing and important. 1-3 sentences max.
- When done:true, confirm what you captured and say you're ready to log.`;

  const raw = await callClaude(
    messages.map(m => ({ role: m.role, content: m.content })),
    systemPrompt,
    'session_parse',
    512,
  );

  // First line is JSON, rest is the conversational message
  const newlineIdx = raw.indexOf('\n');
  const jsonLine = newlineIdx > 0 ? raw.slice(0, newlineIdx).trim() : raw.trim();
  const message = newlineIdx > 0 ? raw.slice(newlineIdx).trim() : '';

  try {
    const jsonMatch = jsonLine.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        extracted: parsed.extracted || {},
        message: message || 'Got it.',
        done: parsed.done === true,
      };
    }
  } catch {
    // fall through to raw response
  }

  return { extracted: {}, message: raw, done: false };
}

// ── Training gap ─────────────────────────────────────────────────────────────

export function getTrainingGapDays(sessions: Session[]): number {
  if (sessions.length === 0) return Infinity;
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const lastDate = new Date(sorted[0].date + 'T12:00:00');
  const today = new Date();
  return Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
}
