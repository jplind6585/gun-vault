/**
 * Playwright global setup — creates a minimal auth bypass session so every
 * test can skip Supabase sign-in without needing real credentials.
 *
 * Usage: npx playwright test  (no env vars needed)
 *
 * The saved session file (.playwright-auth/session.json) is gitignored.
 */
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SESSION_FILE = path.join(__dirname, '../.playwright-auth/session.json');

export default async function globalSetup() {
  // Create the auth dir if needed
  fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Inject all bypass keys before the app boots
  await page.addInitScript(() => {
    localStorage.setItem('gunvault_e2e_user', 'e2e-test-user-id');
    localStorage.setItem('lindcott_initial_goals', JSON.stringify({ goals: ['tracking'], answeredAt: new Date().toISOString() }));
    localStorage.setItem('gunvault_initialized', 'true');
    localStorage.setItem('gunvault_version', '1.9');
  });

  await page.goto('http://localhost:5173');

  // Wait for the nav bar — confirms app has booted past auth and onboarding
  await page.locator('button:has(span:text-is("Home"))').waitFor({ timeout: 15_000 });

  // Save storage state (localStorage)
  await page.context().storageState({ path: SESSION_FILE });
  await browser.close();

  console.log('✅ Auth bypass session saved to', SESSION_FILE);
}
