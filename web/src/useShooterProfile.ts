// useShooterProfile — React hook
// Rebuilds from vault on every mount; persists result to localStorage.

import { useState, useEffect, useCallback } from 'react';
import type { ShooterProfile } from './shooterProfile';
import { inferProfileFromVault, evaluateCheckInTrigger } from './profileInference';
import type { CheckInTrigger } from './profileInference';
import { getStoredProfile, saveProfile } from './profileStorage';
import { getAllGuns, getAllSessions, getAllAmmo } from './storage';

interface UseShooterProfileResult {
  profile: ShooterProfile | null;
  checkInTrigger: CheckInTrigger;
  refresh: () => void;
}

export function useShooterProfile(): UseShooterProfileResult {
  const [profile, setProfile] = useState<ShooterProfile | null>(null);
  const [checkInTrigger, setCheckInTrigger] = useState<CheckInTrigger>('none');

  const refresh = useCallback(() => {
    const guns = getAllGuns();
    const sessions = getAllSessions();
    const ammoLots = getAllAmmo();
    const existing = getStoredProfile();

    const updated = inferProfileFromVault(guns, sessions, ammoLots, existing);
    saveProfile(updated);
    setProfile(updated);

    const trigger = evaluateCheckInTrigger(updated, guns, sessions, ammoLots);
    setCheckInTrigger(trigger);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, checkInTrigger, refresh };
}
