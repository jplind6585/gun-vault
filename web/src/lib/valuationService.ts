// Gun valuation service — calls the gun-valuation edge function
// Engine: Claude AI (GunBroker/Blue Book swap-in when keys arrive)

import { SUPABASE_URL } from './supabase';

const EDGE_URL = `${SUPABASE_URL}/functions/v1/gun-valuation`;
const SUPABASE_SESSION_KEY = 'sb-joturvmcygdmpnhfsslu-auth-token';

export interface ValuationResult {
  low: number;
  high: number;
  median: number;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
  condition: string;
  source: 'claude' | 'gunbroker' | 'bluebook';
  timestamp: string;
}

async function getToken(): Promise<string | null> {
  try {
    const raw = localStorage.getItem(SUPABASE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token ?? parsed?.[0]?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function getGunValuation(params: {
  make: string;
  model: string;
  caliber?: string;
  condition?: string;
}): Promise<ValuationResult> {
  const token = await getToken();
  if (!token) throw new Error('Not signed in');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? `Valuation failed (${res.status})`);
    }

    return await res.json() as ValuationResult;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('Valuation timed out — try again');
    throw err;
  }
}

export async function getWishlistValuation(params: {
  make: string;
  model: string;
  caliber?: string;
}): Promise<ValuationResult> {
  return getGunValuation({ ...params, condition: 'Very Good' });
}
