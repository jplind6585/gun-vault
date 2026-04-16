import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  globalSetup: './e2e/globalSetup.ts',
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    // Mobile viewport (app is capped at 480px)
    viewport: { width: 390, height: 844 },
    // Don't save browser state between tests — each test gets fresh localStorage
    storageState: undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Start the Vite dev server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
