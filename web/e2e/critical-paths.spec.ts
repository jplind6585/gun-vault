/**
 * Critical path e2e tests — covers the flows most likely to regress.
 * Run: npm run test:e2e
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedLocalStorage, TEST_GUN, TEST_AMMO, waitForApp, tapNav, waitForHome } from './helpers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_FILE = path.join(__dirname, '../.playwright-auth/session.json');

// Reuse saved auth session if it exists
const storageState = fs.existsSync(SESSION_FILE) ? SESSION_FILE : undefined;
test.use({ storageState });

// ── 1. Add a gun ──────────────────────────────────────────────────────────────

test('add a gun — form saves to vault', async ({ page }) => {
  await seedLocalStorage(page, { guns: [], ammo: [], sessions: [] });
  await page.goto('/');
  await waitForHome(page);

  // Navigate to Vault
  await tapNav(page, 'Vault');

  // Open FAB and pick "Add Gun"
  await page.locator('button:has-text("+")').last().click();
  await page.getByRole('button', { name: 'Add Gun' }).click();

  // Wait for the Add Firearm form
  await page.getByPlaceholder('e.g. Glock, Sig Sauer, S&W...').waitFor({ timeout: 5000 });

  // Fill form — use exact placeholders to avoid matching the vault search box
  await page.getByPlaceholder('e.g. Glock, Sig Sauer, S&W...').fill('Glock');
  await page.getByPlaceholder('e.g. G19 Gen5, P320 Compact...').fill('G19');
  // Use the 9mm quick chip instead of typing (avoids caliber search-box collision)
  await page.locator('button:has-text("9mm")').first().click();

  // Type — Pistol is usually pre-selected; click to be safe
  await page.locator('button:has-text("Pistol")').first().click();

  // Save
  await page.locator('button[type="submit"]').click();

  // Gun should appear in the vault list
  await expect(page.getByText('G19').first()).toBeVisible({ timeout: 8000 });
});

// ── 2. Log a session ──────────────────────────────────────────────────────────

test('log a session — saves and shows confirm', async ({ page }) => {
  await seedLocalStorage(page, {
    guns: [TEST_GUN],
    ammo: [],
    sessions: [],
  });
  await page.goto('/');
  await waitForHome(page);

  // Navigate to Sessions
  await tapNav(page, 'Sessions');

  // Open FAB → Log Session
  await page.locator('button:has-text("+")').last().click();
  await page.getByRole('button', { name: 'Log Session' }).click();

  // Pick gun from the list
  await page.locator('text=Glock G17').first().click();

  // Enter rounds
  await page.locator('input[type="number"]').first().fill('100');

  // Save
  await page.locator('button:has-text("Log Session")').click();

  // Confirm screen
  await expect(page.getByText('Session Logged').first()).toBeVisible({ timeout: 8000 });
});

// ── 3. Add ammo ───────────────────────────────────────────────────────────────

test('add an ammo lot — appears in Arsenal', async ({ page }) => {
  await seedLocalStorage(page, { guns: [], ammo: [], sessions: [] });
  await page.goto('/');
  await waitForHome(page);

  // Open FAB → Add Ammo (navigates to vault ammo section and opens modal)
  await page.locator('button:has-text("+")').last().click();
  await page.getByRole('button', { name: 'Add Ammo' }).click();

  // Wait for modal
  await page.getByText('ADD AMMO TO INVENTORY').waitFor({ timeout: 5000 });

  // Fill form — press Escape after TypeaheadInput to close autocomplete dropdown
  await page.locator('input[placeholder="9mm Luger"]').fill('9mm');
  await page.keyboard.press('Escape');
  await page.locator('input[placeholder="Federal"]').fill('Federal');
  await page.keyboard.press('Escape');
  // Grain weight and quantity (plain number inputs)
  await page.locator('input[placeholder="124"]').fill('124');
  await page.locator('input[placeholder="500"]').fill('200');

  // Save
  await page.getByRole('button', { name: 'ADD TO INVENTORY' }).click();

  // Switch to "ALL LOTS" view so individual lot brands are visible
  await page.getByRole('button', { name: 'ALL LOTS' }).click();
  await expect(page.getByText('Federal').first()).toBeVisible({ timeout: 8000 });
});

// ── 4. Log session from gun detail — skips mode picker ───────────────────────

test('log from gun detail — goes straight to quick log (no mode picker)', async ({ page }) => {
  await seedLocalStorage(page, {
    guns: [TEST_GUN],
    ammo: [TEST_AMMO],
    sessions: [],
  });
  await page.goto('/');
  await waitForHome(page);

  // Go to Vault → Gun Detail
  await tapNav(page, 'Vault');
  await page.locator('text=Glock G17').first().click();

  // Tap "+ LOG" on the gun detail
  await page.getByRole('button', { name: /^\+\s*LOG$/i }).click();

  // Should show the SessionLoggingModal directly (SESSION DEBRIEF heading)
  await expect(page.getByText('SESSION DEBRIEF').first()).toBeVisible({ timeout: 5000 });
});
