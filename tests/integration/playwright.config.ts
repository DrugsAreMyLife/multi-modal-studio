/**
 * Playwright configuration for integration tests
 * Extends the root playwright.config.ts with database-specific settings
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/integration',
  testMatch: '**/*.test.ts',

  // Timeout settings for database operations
  timeout: 30 * 1000, // 30 seconds per test
  expect: {
    timeout: 5 * 1000, // 5 seconds for assertions
  },

  // Run tests serially for database tests to avoid conflicts
  fullyParallel: false,
  workers: 1, // Use single worker to avoid connection pool issues

  // Retries for flaky tests
  retries: process.env.CI ? 2 : 0,

  // Reporting
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/integration-results.json' }],
  ],

  // Use database for tests (not browser)
  use: {
    trace: 'on-first-retry',
  },

  // Don't require a web server for these tests
  webServer: undefined,
});
