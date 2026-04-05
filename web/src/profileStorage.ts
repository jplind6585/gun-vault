// Profile Storage — localStorage persistence with Supabase sync stub
// Same pattern as the rest of the app: local-first, sync in background.

import type { ShooterProfile } from './shooterProfile';

const PROFILE_KEY = 'gunvault_shooter_profile';

// ── localStorage ──────────────────────────────────────────────────────────────

export function getStoredProfile(): ShooterProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ShooterProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: ShooterProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save shooter profile:', e);
  }
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}

// ── Partial updates ───────────────────────────────────────────────────────────

export function updateProfileField<K extends keyof ShooterProfile>(
  key: K,
  value: ShooterProfile[K],
): ShooterProfile | null {
  const existing = getStoredProfile();
  if (!existing) return null;
  const updated: ShooterProfile = { ...existing, [key]: value, updatedAt: new Date().toISOString() };
  saveProfile(updated);
  return updated;
}
