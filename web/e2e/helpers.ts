/**
 * Shared test helpers — seed localStorage with known data, navigate to views, etc.
 */
import { Page } from '@playwright/test';

/** A minimal gun that can be saved without hitting any required-field validation */
export const TEST_GUN = {
  id: 'e2e-gun-1',
  make: 'Glock',
  model: 'G17',
  caliber: '9mm',
  type: 'Pistol',
  action: 'Semi-Automatic',
  status: 'Active',
  serialNumber: 'TSTE2E001',
  roundCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const TEST_AMMO = {
  id: 'e2e-ammo-1',
  brand: 'Federal',
  productLine: 'HST',
  caliber: '9mm',
  grainWeight: 124,
  quantity: 500,
  purchasePricePerRound: 0.55,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/** Inject test data into localStorage before the app boots */
export async function seedLocalStorage(page: Page, overrides: {
  guns?: object[];
  ammo?: object[];
  sessions?: object[];
} = {}) {
  await page.addInitScript(({ guns, ammo, sessions }) => {
    localStorage.setItem('gunvault_guns', JSON.stringify(guns));
    localStorage.setItem('gunvault_ammo', JSON.stringify(ammo));
    localStorage.setItem('gunvault_sessions', JSON.stringify(sessions));
    localStorage.setItem('gunvault_initialized', 'true');
    localStorage.setItem('gunvault_version', '1.9');
    // Bypass Supabase auth and onboarding
    localStorage.setItem('gunvault_e2e_user', 'e2e-test-user-id');
    localStorage.setItem('lindcott_initial_goals', JSON.stringify({ goals: ['tracking'], answeredAt: new Date().toISOString() }));
  }, {
    guns: overrides.guns ?? [TEST_GUN],
    ammo: overrides.ammo ?? [TEST_AMMO],
    sessions: overrides.sessions ?? [],
  });
}

/** Wait for the app to be idle (spinner gone, main view rendered) */
export async function waitForApp(page: Page) {
  await page.waitForLoadState('networkidle');
}

/** Navigate to a tab via the bottom nav */
export async function tapNav(page: Page, label: 'Home' | 'Vault' | 'Sessions' | 'More' | 'Targets') {
  // MobileNav renders buttons with an icon + span text. Match the span text directly.
  await page.locator(`button:has(span:text-is("${label}"))`).click();
}

/** Wait for the app home screen to be visible (nav bar rendered) */
export async function waitForHome(page: Page) {
  // Wait for the nav bar — its presence means the app is past auth and onboarding
  await page.locator('button:has(span:text-is("Home"))').waitFor({ timeout: 15_000 });
}
