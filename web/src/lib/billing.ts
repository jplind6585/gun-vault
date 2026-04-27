/**
 * Billing — RevenueCat wrapper for Google Play (and eventually App Store)
 *
 * On native (Capacitor): uses RevenueCat → Google Play Billing
 * On web: not available — UpgradeModal falls back to free claim flow
 *
 * Setup checklist:
 *  1. Create RevenueCat account at revenuecat.com
 *  2. Connect Google Play Console app to RevenueCat
 *  3. Create Entitlement: "pro"
 *  4. Create Offering with Package linked to Play product "pro_monthly"
 *  5. Add VITE_REVENUECAT_GOOGLE_API_KEY to Netlify env vars
 */

import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PurchaseResult {
  success: boolean;
  error?: 'cancelled' | 'not_available' | 'already_subscribed' | 'unknown';
  message?: string;
}

export type BillingTier = 'pro' | 'premium';

// ── Platform detection ────────────────────────────────────────────────────────

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

// ── RevenueCat initialization ─────────────────────────────────────────────────

let _initialized = false;

export async function initBilling(userId: string): Promise<void> {
  if (!isNativePlatform()) return;
  if (_initialized) return;

  const apiKey = import.meta.env.VITE_REVENUECAT_GOOGLE_API_KEY as string | undefined;
  // Skip init if no key or if it's a test key without products configured yet
  if (!apiKey || apiKey.startsWith('test_')) {
    console.warn('[billing] RevenueCat skipped — configure production key before launch');
    return;
  }

  try {
    const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
    await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
    await Purchases.configure({ apiKey, appUserID: userId });
    _initialized = true;
  } catch (err) {
    console.warn('[billing] RevenueCat init failed:', err);
  }
}

// ── Check entitlements via RevenueCat ────────────────────────────────────────

export async function checkProEntitlement(): Promise<boolean> {
  if (!isNativePlatform() || !_initialized) return false;
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.getCustomerInfo();
    return !!customerInfo.entitlements.active['pro'] || !!customerInfo.entitlements.active['premium'];
  } catch {
    return false;
  }
}

export async function checkPremiumEntitlement(): Promise<boolean> {
  if (!isNativePlatform() || !_initialized) return false;
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.getCustomerInfo();
    return !!customerInfo.entitlements.active['premium'];
  } catch {
    return false;
  }
}

// ── Purchase subscriptions ────────────────────────────────────────────────────

export async function purchasePro(): Promise<PurchaseResult> {
  if (!isNativePlatform()) {
    return { success: false, error: 'not_available' };
  }
  if (!_initialized) {
    return { success: false, error: 'not_available', message: 'Billing not ready. Try again.' };
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');

    // Get current offerings
    const { current } = await Purchases.getOfferings();
    if (!current || current.availablePackages.length === 0) {
      return { success: false, error: 'not_available', message: 'No subscription available. Try again later.' };
    }

    const pkg = current.monthly ?? current.availablePackages[0];
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });

    if (customerInfo.entitlements.active['pro']) {
      return { success: true };
    }
    return { success: false, error: 'unknown', message: 'Purchase processed but Pro not activated. Contact support.' };

  } catch (err: unknown) {
    // RevenueCat throws a PurchasesError with a userCancelled flag
    const rcErr = err as { userCancelled?: boolean; message?: string };
    if (rcErr?.userCancelled) {
      return { success: false, error: 'cancelled' };
    }
    console.warn('[billing] purchase failed:', err);
    return { success: false, error: 'unknown', message: 'Purchase failed. Please try again.' };
  }
}

// ── Purchase Premium subscription ────────────────────────────────────────────

export async function purchasePremium(): Promise<PurchaseResult> {
  if (!isNativePlatform()) {
    return { success: false, error: 'not_available' };
  }
  if (!_initialized) {
    return { success: false, error: 'not_available', message: 'Billing not ready. Try again.' };
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { current } = await Purchases.getOfferings();
    if (!current || current.availablePackages.length === 0) {
      return { success: false, error: 'not_available', message: 'No subscription available. Try again later.' };
    }

    // Find the Premium offering; fall back to first available if not found
    const premiumOffering = current.availablePackages.find(
      p => p.identifier.toLowerCase().includes('premium')
    ) ?? current.availablePackages[0];

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: premiumOffering });

    if (customerInfo.entitlements.active['premium']) {
      return { success: true };
    }
    return { success: false, error: 'unknown', message: 'Purchase processed but Premium not activated. Contact support.' };

  } catch (err: unknown) {
    const rcErr = err as { userCancelled?: boolean; message?: string };
    if (rcErr?.userCancelled) return { success: false, error: 'cancelled' };
    console.warn('[billing] premium purchase failed:', err);
    return { success: false, error: 'unknown', message: 'Purchase failed. Please try again.' };
  }
}

// ── Tier status checks (web + native fallback) ───────────────────────────────
// Primary source of truth: Supabase user_profiles.
// On native with RC initialized, RevenueCat entitlements are also checked.
// Premium satisfies the Pro gate — always check both in getProStatus.

export async function getProStatus(userId: string): Promise<boolean> {
  if (isNativePlatform() && _initialized) {
    return checkProEntitlement(); // checkProEntitlement checks both 'pro' and 'premium' RC entitlements
  }
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('is_pro, pro_expires_at, is_premium, premium_expires_at')
      .eq('user_id', userId)
      .single();
    if (!data) return false;
    const now = new Date();
    const proActive = data.is_pro && (!data.pro_expires_at || new Date(data.pro_expires_at) > now);
    const premiumActive = data.is_premium && (!data.premium_expires_at || new Date(data.premium_expires_at) > now);
    return proActive || premiumActive;
  } catch {
    return false;
  }
}

export async function getPremiumStatus(userId: string): Promise<boolean> {
  if (isNativePlatform() && _initialized) {
    return checkPremiumEntitlement();
  }
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('is_premium, premium_expires_at')
      .eq('user_id', userId)
      .single();
    if (!data?.is_premium) return false;
    if (data.premium_expires_at && new Date(data.premium_expires_at) < new Date()) return false;
    return true;
  } catch {
    return false;
  }
}

// ── Restore purchases ─────────────────────────────────────────────────────────

export async function restorePurchases(): Promise<{ isPro: boolean; isPremium: boolean }> {
  if (!isNativePlatform() || !_initialized) return { isPro: false, isPremium: false };
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.restorePurchases();
    const isPremium = !!customerInfo.entitlements.active['premium'];
    const isPro = isPremium || !!customerInfo.entitlements.active['pro'];
    return { isPro, isPremium };
  } catch {
    return { isPro: false, isPremium: false };
  }
}
