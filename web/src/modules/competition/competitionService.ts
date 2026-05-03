import { supabase } from '../../lib/supabase';
import type {
  CompetitionEvent, UserEventPlan, CompetitionResult,
  CompetitionRule, ClassifierThreshold, Discipline,
} from './types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function userId(): string | null {
  try {
    const raw = localStorage.getItem('sb-joturvmcygdmpnhfsslu-auth-token');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user?.id ?? parsed?.[0]?.user?.id ?? null;
  } catch { return null; }
}

// snake_case DB row → camelCase type
function rowToEvent(r: Record<string, unknown>): CompetitionEvent {
  return {
    id: r.id as string,
    name: r.name as string,
    discipline: r.discipline as Discipline,
    divisions: (r.divisions as string[]) ?? [],
    date: r.date as string,
    location: r.location as string | undefined,
    state: r.state as string | undefined,
    country: (r.country as string) ?? 'US',
    organizerName: r.organizer_name as string | undefined,
    organizerEmail: r.organizer_email as string | undefined,
    officialUrl: r.official_url as string | undefined,
    practiscoreId: r.practiccore_id as string | undefined,
    entryFee: r.entry_fee as number | undefined,
    stageCount: r.stage_count as number | undefined,
    roundCount: r.round_count as number | undefined,
    registrationDeadline: r.registration_deadline as string | undefined,
    source: r.source as CompetitionEvent['source'],
    verifiedAt: r.verified_at as string | undefined,
    notes: r.notes as string | undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function rowToPlan(r: Record<string, unknown>): UserEventPlan {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    eventId: r.event_id as string | undefined,
    eventName: r.event_name as string,
    discipline: r.discipline as Discipline,
    division: r.division as string,
    date: r.date as string,
    priority: r.priority as UserEventPlan['priority'],
    gunId: r.gun_id as string | undefined,
    ammoLotId: r.ammo_lot_id as string | undefined,
    trainingPlan: r.training_plan as UserEventPlan['trainingPlan'],
    trainingPlanReasoning: r.training_plan_reasoning as string | undefined,
    seasonPhase: r.season_phase as UserEventPlan['seasonPhase'],
    notes: r.notes as string | undefined,
    createdAt: r.created_at as string,
  };
}

function rowToResult(r: Record<string, unknown>): CompetitionResult {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    eventId: r.event_id as string | undefined,
    eventName: r.event_name as string,
    discipline: r.discipline as Discipline,
    division: r.division as string,
    date: r.date as string,
    placement: r.placement as number | undefined,
    totalCompetitors: r.total_competitors as number | undefined,
    score: r.score as number | undefined,
    scoreUnit: r.score_unit as CompetitionResult['scoreUnit'],
    gunId: r.gun_id as string | undefined,
    ammoLotId: r.ammo_lot_id as string | undefined,
    stageData: r.stage_data as CompetitionResult['stageData'],
    notes: r.notes as string | undefined,
    aiDebrief: r.ai_debrief as CompetitionResult['aiDebrief'],
    reasoning: r.reasoning as string | undefined,
    createdAt: r.created_at as string,
  };
}

// ─── events ──────────────────────────────────────────────────────────────────

export async function getEvents(discipline?: Discipline): Promise<CompetitionEvent[]> {
  let q = supabase.from('competition_events').select('*').order('date');
  if (discipline) q = q.eq('discipline', discipline);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(rowToEvent);
}

export async function getUpcomingEvents(limitDays = 180): Promise<CompetitionEvent[]> {
  const today = new Date().toISOString().split('T')[0];
  const cutoff = new Date(Date.now() + limitDays * 86400000).toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('competition_events')
    .select('*')
    .gte('date', today)
    .lte('date', cutoff)
    .order('date');
  if (error) throw error;
  return (data ?? []).map(rowToEvent);
}

// ─── user event plans ─────────────────────────────────────────────────────────

export async function getEventPlans(): Promise<UserEventPlan[]> {
  const { data, error } = await supabase
    .from('user_event_plans')
    .select('*')
    .order('date');
  if (error) throw error;
  return (data ?? []).map(rowToPlan);
}

export async function addEventPlan(
  plan: Omit<UserEventPlan, 'id' | 'userId' | 'createdAt'>
): Promise<UserEventPlan> {
  const uid_ = userId();
  if (!uid_) throw new Error('Not signed in');
  const row = {
    id: uid(),
    user_id: uid_,
    event_id: plan.eventId ?? null,
    event_name: plan.eventName,
    discipline: plan.discipline,
    division: plan.division,
    date: plan.date,
    priority: plan.priority,
    gun_id: plan.gunId ?? null,
    ammo_lot_id: plan.ammoLotId ?? null,
    training_plan: plan.trainingPlan ?? null,
    training_plan_reasoning: plan.trainingPlanReasoning ?? null,
    season_phase: plan.seasonPhase ?? null,
    notes: plan.notes ?? null,
  };
  const { data, error } = await supabase.from('user_event_plans').insert(row).select().single();
  if (error) throw error;
  return rowToPlan(data);
}

export async function updateEventPlan(
  id: string,
  updates: Partial<Omit<UserEventPlan, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (updates.eventName !== undefined)           row.event_name = updates.eventName;
  if (updates.discipline !== undefined)           row.discipline = updates.discipline;
  if (updates.division !== undefined)             row.division = updates.division;
  if (updates.date !== undefined)                 row.date = updates.date;
  if (updates.priority !== undefined)             row.priority = updates.priority;
  if (updates.gunId !== undefined)                row.gun_id = updates.gunId;
  if (updates.ammoLotId !== undefined)            row.ammo_lot_id = updates.ammoLotId;
  if (updates.trainingPlan !== undefined)         row.training_plan = updates.trainingPlan;
  if (updates.trainingPlanReasoning !== undefined) row.training_plan_reasoning = updates.trainingPlanReasoning;
  if (updates.seasonPhase !== undefined)          row.season_phase = updates.seasonPhase;
  if (updates.notes !== undefined)                row.notes = updates.notes;
  const { error } = await supabase.from('user_event_plans').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteEventPlan(id: string): Promise<void> {
  const { error } = await supabase.from('user_event_plans').delete().eq('id', id);
  if (error) throw error;
}

// ─── results ─────────────────────────────────────────────────────────────────

export async function getResults(discipline?: Discipline): Promise<CompetitionResult[]> {
  let q = supabase.from('competition_results').select('*').order('date', { ascending: false });
  if (discipline) q = q.eq('discipline', discipline);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(rowToResult);
}

export async function addResult(
  result: Omit<CompetitionResult, 'id' | 'userId' | 'createdAt'>
): Promise<CompetitionResult> {
  const uid_ = userId();
  if (!uid_) throw new Error('Not signed in');
  const row = {
    id: uid(),
    user_id: uid_,
    event_id: result.eventId ?? null,
    event_name: result.eventName,
    discipline: result.discipline,
    division: result.division,
    date: result.date,
    placement: result.placement ?? null,
    total_competitors: result.totalCompetitors ?? null,
    score: result.score ?? null,
    score_unit: result.scoreUnit ?? null,
    gun_id: result.gunId ?? null,
    ammo_lot_id: result.ammoLotId ?? null,
    classifier_score: result.classifierScore ?? null,
    stage_data: result.stageData ?? null,
    notes: result.notes ?? null,
    ai_debrief: result.aiDebrief ?? null,
    reasoning: result.reasoning ?? null,
  };
  const { data, error } = await supabase.from('competition_results').insert(row).select().single();
  if (error) throw error;
  return rowToResult(data);
}

export async function updateResult(
  id: string,
  updates: Partial<Pick<CompetitionResult, 'notes' | 'stageData' | 'aiDebrief' | 'reasoning'>>
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (updates.notes !== undefined)      row.notes = updates.notes;
  if (updates.stageData !== undefined)  row.stage_data = updates.stageData;
  if (updates.aiDebrief !== undefined)  row.ai_debrief = updates.aiDebrief;
  if (updates.reasoning !== undefined)  row.reasoning = updates.reasoning;
  const { error } = await supabase.from('competition_results').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteResult(id: string): Promise<void> {
  const { error } = await supabase.from('competition_results').delete().eq('id', id);
  if (error) throw error;
}

// ─── rules + thresholds ──────────────────────────────────────────────────────

export async function getRulesForDivision(
  discipline: string, division: string
): Promise<CompetitionRule[]> {
  const { data, error } = await supabase
    .from('competition_rules')
    .select('*')
    .eq('discipline', discipline)
    .eq('division', division);
  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id,
    discipline: r.discipline,
    division: r.division,
    ruleCategory: r.rule_category,
    ruleDescription: r.rule_description,
    ruleValue: r.rule_value ?? undefined,
    ruleUnit: r.rule_unit ?? undefined,
    grayArea: r.gray_area,
    grayAreaNote: r.gray_area_note ?? undefined,
    lastVerified: r.last_verified ?? undefined,
  }));
}

export async function getClassifierThresholds(discipline: string): Promise<ClassifierThreshold[]> {
  const { data, error } = await supabase
    .from('classifier_thresholds')
    .select('*')
    .eq('discipline', discipline);
  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id,
    discipline: r.discipline,
    division: r.division ?? undefined,
    className: r.class_name,
    minPercent: r.min_percent ?? undefined,
    maxPercent: r.max_percent ?? undefined,
    notes: r.notes ?? undefined,
  }));
}

// ─── ammo correlation ────────────────────────────────────────────────────────

export async function getAmmoCorrelation(discipline?: Discipline) {
  // Returns results grouped by ammo_lot_id with avg score and placement
  let q = supabase
    .from('competition_results')
    .select('ammo_lot_id, score, placement, total_competitors, score_unit, discipline')
    .not('ammo_lot_id', 'is', null)
    .not('score', 'is', null);
  if (discipline) q = q.eq('discipline', discipline);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
