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

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PurchaseResult {
  success: boolean;
  error?: 'cancelled' | 'not_available' | 'already_subscribed' | 'unknown';
  message?: string;
}

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
  if (!apiKey) {
    console.warn('[billing] VITE_REVENUECAT_GOOGLE_API_KEY not set — billing unavailable');
    return;
  }

  try {
    const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
    await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
    await Purchases.configure({ apiKey, appUserID: userId });
    _initialized = true;
    console.log('[billing] RevenueCat initialized for user', userId);
  } catch (err) {
    console.warn('[billing] RevenueCat init failed:', err);
  }
}

// ── Check Pro status via RevenueCat ──────────────────────────────────────────

export async function checkProEntitlement(): Promise<boolean> {
  if (!isNativePlatform() || !_initialized) return false;
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.getCustomerInfo();
    return !!customerInfo.entitlements.active['pro'];
  } catch {
    return false;
  }
}

// ── Purchase Pro subscription ─────────────────────────────────────────────────

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

// ── Restore purchases ─────────────────────────────────────────────────────────

export async function restorePurchases(): Promise<boolean> {
  if (!isNativePlatform() || !_initialized) return false;
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.restorePurchases();
    return !!customerInfo.entitlements.active['pro'];
  } catch {
    return false;
  }
}
