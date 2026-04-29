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

export const COMMON_CALIBERS = [
  '9mm', '5.56 NATO', '.308 Win', '.45 ACP', '.22 LR',
];

// Normalize user input before searching: collapse "m m" → "mm", "9 mm" → "9mm", etc.
export function normalizeCaliber(s: string): string {
  return s
    .replace(/m\s+m/gi, 'mm')
    .replace(/(\d)\s+mm/gi, '$1mm')
    .replace(/\s*\.\s*(\d)/g, '.$1')
    .trim();
}

export async function searchCalibers(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  const normalized = normalizeCaliber(query);
  try {
    const { data } = await supabase
      .from('cartridges')
      .select('name')
      .ilike('name', `%${normalized}%`)
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
  platform_family?: string | null;
  caliber_options?: string[] | null;
  units_produced_estimate?: string | null;
  model_aliases?: string[] | null;
  production_status?: string | null;
  action_detail?: string | null;
  era?: string | null;
  magazine_compatibility?: string[] | null;
}

export async function searchGunModels(model: string, make?: string): Promise<{ make: string; model: string }[]> {
  if (!model.trim() || model.length < 2) return [];
  try {
    let query = supabase
      .from('gun_models')
      .select('make,model')
      .ilike('model', `%${model}%`);
    if (make && make.trim().length >= 2) {
      query = query.ilike('make', `%${make}%`);
    }
    const { data } = await query.order('model').limit(12);
    return (data ?? []) as { make: string; model: string }[];
  } catch {
    return [];
  }
}

// ── Retailers ─────────────────────────────────────────────────────────────────
// Queries the retailers + retailer_categories tables.
// Featured retailers (featured = true) sort first; all others alphabetically.
// Only Family / Independent retailers are eligible for featured = true (DB constraint).
export async function searchRetailers(
  category: string,
  query: string
): Promise<{ name: string; featured: boolean }[]> {
  try {
    const { data } = await supabase
      .from('retailer_categories')
      .select('featured, retailers!retailer_id (name, active)')
      .eq('primary_category', category);
    if (!data) return [];
    let results = (data as any[])
      .map(r => ({
        name: r.retailers?.name as string,
        featured: !!r.featured,
        active: r.retailers?.active !== false,
      }))
      .filter(r => r.name && r.active);
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(r => r.name.toLowerCase().includes(q));
    }
    return results
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 12)
      .map(r => ({ name: r.name, featured: r.featured }));
  } catch {
    return [];
  }
}

// ── Optic model search (no brand filter) ──────────────────────────────────────
// Used when brand is not yet set — lets users search model names directly.
export async function searchOpticModels(query: string): Promise<string[]> {
  if (!query.trim() || query.length < 2) return [];
  try {
    const { data } = await supabase
      .from('optic_models')
      .select('model')
      .ilike('model', `%${query}%`)
      .order('model')
      .limit(12);
    return data?.map((r: { model: string }) => r.model) ?? [];
  } catch {
    return [];
  }
}

export async function checkGunModel(make: string, model: string): Promise<GunModelSpec | null> {
  if (!make.trim() || !model.trim()) return null;
  const sel = 'caliber,type,action,capacity,caliber_options,model_aliases';
  try {
    // Exact match first
    const { data } = await supabase
      .from('gun_models')
      .select(sel)
      .ilike('make', make)
      .ilike('model', model)
      .limit(1)
      .maybeSingle();
    if (data) return data as GunModelSpec;

    // Fuzzy fallback: model name contains user input (catches "G19" when user typed "Glock 19", etc.)
    const { data: fuzzy } = await supabase
      .from('gun_models')
      .select(sel)
      .ilike('make', `%${make}%`)
      .ilike('model', `%${model}%`)
      .limit(1)
      .maybeSingle();
    return fuzzy as GunModelSpec | null;
  } catch {
    return null;
  }
}

// ── Powder autocomplete ───────────────────────────────────────────────────────

export interface PowderResult {
  id: string;
  name: string;
  manufacturer: string;
  burnRateRank: number | null;
  burnRateCategory: string | null;
  grainShape: string | null;
  doubleChargeVisible: boolean;
  description: string | null;
  typicalCalibers: string[] | null;
  alternateNames: string[] | null;
}

export async function searchPowders(query: string): Promise<PowderResult[]> {
  if (!query.trim()) return [];
  try {
    const { data } = await supabase
      .from('powders')
      .select('id, name, manufacturer, burn_rate_rank, burn_rate_category, grain_shape, double_charge_visible, description, typical_calibers, alternate_names')
      .or(`name.ilike.%${query}%,manufacturer.ilike.%${query}%`)
      .neq('production_status', 'Discontinued')
      .order('burn_rate_rank', { ascending: true, nullsFirst: false })
      .limit(12);
    return (data ?? []).map((r: {
      id: string; name: string; manufacturer: string;
      burn_rate_rank: number | null; burn_rate_category: string | null;
      grain_shape: string | null; double_charge_visible: boolean;
      description: string | null; typical_calibers: string[] | null; alternate_names: string[] | null;
    }) => ({
      id: r.id,
      name: r.name,
      manufacturer: r.manufacturer,
      burnRateRank: r.burn_rate_rank ?? null,
      burnRateCategory: r.burn_rate_category ?? null,
      grainShape: r.grain_shape ?? null,
      doubleChargeVisible: r.double_charge_visible,
      description: r.description ?? null,
      typicalCalibers: r.typical_calibers ?? null,
      alternateNames: r.alternate_names ?? null,
    }));
  } catch {
    return [];
  }
}
