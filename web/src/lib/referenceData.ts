// Supabase-backed reference data lookups with local fallback.
// All functions return empty arrays/null on error — callers merge with local data.
import { supabase } from './supabase';

export async function searchManufacturers(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  try {
    const { data } = await supabase
      .from('manufacturers')
      .select('name')
      .ilike('name', `%${query}%`)
      .eq('active', true)
      .order('name')
      .limit(12);
    return data?.map((r: { name: string }) => r.name) ?? [];
  } catch {
    return [];
  }
}

export async function searchCalibers(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  try {
    const { data } = await supabase
      .from('cartridges')
      .select('name')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(12);
    return data?.map((r: { name: string }) => r.name) ?? [];
  } catch {
    return [];
  }
}

export async function getOpticBrands(): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('optic_models')
      .select('brand')
      .order('brand');
    return [...new Set((data ?? []).map((r: { brand: string }) => r.brand))];
  } catch {
    return [];
  }
}

export async function getOpticModelsForBrand(brand: string): Promise<string[]> {
  if (!brand.trim()) return [];
  try {
    const { data } = await supabase
      .from('optic_models')
      .select('model')
      .ilike('brand', brand)
      .order('model');
    return data?.map((r: { model: string }) => r.model) ?? [];
  } catch {
    return [];
  }
}

export interface OpticSpec {
  optic_type: string;
  magnification_min: number | null;
  magnification_max: number | null;
  objective_mm: number | null;
  focal_plane: string | null;
  reticle_name: string | null;
  illuminated: boolean;
  turret_unit: string | null;
  click_value_moa: number | null;
  click_value_mrad: number | null;
  battery_type: string | null;
  weight_oz: number | null;
  msrp_usd: number | null;
}

export async function getOpticSpec(brand: string, model: string): Promise<OpticSpec | null> {
  try {
    const { data } = await supabase
      .from('optic_models')
      .select('optic_type,magnification_min,magnification_max,objective_mm,focal_plane,reticle_name,illuminated,turret_unit,click_value_moa,click_value_mrad,battery_type,weight_oz,msrp_usd')
      .ilike('brand', brand)
      .ilike('model', model)
      .limit(1)
      .maybeSingle();
    return data as OpticSpec | null;
  } catch {
    return null;
  }
}

export interface GunModelSpec {
  caliber: string | null;
  type: string | null;
  action: string | null;
  capacity: number | null;
}

export async function checkGunModel(make: string, model: string): Promise<GunModelSpec | null> {
  if (!make.trim() || !model.trim()) return null;
  try {
    const { data } = await supabase
      .from('gun_models')
      .select('caliber,type,action,capacity')
      .ilike('make', make)
      .ilike('model', model)
      .limit(1)
      .maybeSingle();
    return data as GunModelSpec | null;
  } catch {
    return null;
  }
}
