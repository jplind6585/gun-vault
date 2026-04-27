import { supabase } from '../lib/supabase';
import { ShootingDrill, DrillDiscipline } from '../types';

export interface DrillFilters {
  discipline?: DrillDiscipline;
  holsterRequired?: boolean;
  movementRequired?: boolean;
  dryFireOnly?: boolean;
  maxRoundCount?: number;
  maxDistanceYards?: number;
  skillFocus?: string[];
  competitionRelevance?: string;
  difficulty?: number;
}

export async function getDrills(filters?: DrillFilters): Promise<ShootingDrill[]> {
  let query = supabase
    .from('shooting_drills')
    .select('*')
    .order('name', { ascending: true });

  if (filters?.discipline) {
    query = query.contains('discipline', [filters.discipline]);
  }
  if (filters?.holsterRequired !== undefined) {
    query = query.eq('holster_required', filters.holsterRequired);
  }
  if (filters?.movementRequired !== undefined) {
    query = query.eq('movement_required', filters.movementRequired);
  }
  if (filters?.dryFireOnly) {
    query = query.eq('dry_fire_capable', true);
  }
  if (filters?.maxRoundCount !== undefined) {
    query = query.lte('round_count', filters.maxRoundCount);
  }
  if (filters?.maxDistanceYards !== undefined) {
    query = query.lte('distance_yards', filters.maxDistanceYards);
  }
  if (filters?.difficulty !== undefined) {
    query = query.eq('difficulty', filters.difficulty);
  }
  if (filters?.skillFocus?.length) {
    query = query.overlaps('skill_focus', filters.skillFocus);
  }
  if (filters?.competitionRelevance) {
    query = query.contains('competition_relevance', [filters.competitionRelevance]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ShootingDrill[];
}

export async function getDrillById(id: string): Promise<ShootingDrill | null> {
  const { data, error } = await supabase
    .from('shooting_drills')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as ShootingDrill;
}
