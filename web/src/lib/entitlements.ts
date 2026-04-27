/**
 * Entitlements — single source of truth for tier checking.
 *
 * Tiers: free < pro < premium (premium includes all pro features)
 *
 * Usage:
 *   const { isPro, isPremium, tier } = useEntitlements();
 *
 * Do not gate features directly on isPro/isPremium booleans in new code —
 * always derive from `tier` so Premium users never miss a Pro feature.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { getProStatus, getPremiumStatus } from './billing';

export type Entitlement = 'free' | 'pro' | 'premium';

export interface EntitlementsState {
  tier: Entitlement;
  /** true for Pro or Premium */
  isPro: boolean;
  /** true for Premium only */
  isPremium: boolean;
  loading: boolean;
}

export function useEntitlements(): EntitlementsState {
  const { user } = useAuth();
  const [tier, setTier] = useState<Entitlement>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTier('free');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [pro, premium] = await Promise.all([
        getProStatus(user.id),
        getPremiumStatus(user.id),
      ]);
      if (cancelled) return;
      if (premium) setTier('premium');
      else if (pro) setTier('pro');
      else setTier('free');
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  return {
    tier,
    isPro: tier === 'pro' || tier === 'premium',
    isPremium: tier === 'premium',
    loading,
  };
}
