import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for WebWidgets E2E testing
 *
 * Environment-aware configuration with:
 * - Runtime readiness orchestration
 * - Retry logic for flaky tests
 * - Trace collection on failure
 * - Screenshots/videos only on failure
 * - Parallelization where safe
 * - Test tags/groups for selective execution
 * - Robust webServer integration with startup modes
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Timeout configuration
  timeout: 60 * 1000, // 60 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds per assertion
  },

  // Retry flaky tests
  retries: process.env.CI ? 2 : 0,

  // Parallelization
  workers: process.env.CI ? 2 : 4,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'tests/e2e/reports/html' }],
    ['json', { outputFile: 'tests/e2e/reports/results.json' }],
    ['junit', { outputFile: 'tests/e2e/reports/junit.xml' }],
    ['list'],
  ],

  // Shared settings for all tests
  use: {
    // Base URL - environment-aware
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure only
    screenshot: 'only-on-failure',

    // Video on failure only
    video: 'retain-on-failure',

    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // Action timeout
    actionTimeout: 10 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,
  },

  // Projects for different browsers and configurations
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile viewport
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    // Critical path tests - run first
    {
      name: 'critical',
      testMatch: /.*\.critical\.spec\.ts/,
      dependencies: ['chromium'],
    },

    // Performance tests - run sequentially
    {
      name: 'performance',
      testMatch: /.*\.perf\.spec\.ts/,
      fullyParallel: false,
      retries: 0,
    },

    // Slow tests - run separately
    {
      name: 'slow',
      testMatch: /.*\.slow\.spec\.ts/,
      fullyParallel: false,
    },
  ],

  // Test organization
  testMatch: [
    '**/*.spec.ts',
    '**/*.e2e.ts',
  ],

  // Ignore patterns
  testIgnore: [
    '**/*.unit.spec.ts',
    '**/node_modules/**',
  ],

  // Output directory
  outputDir: 'tests/e2e/artifacts',

  // Global setup - performs runtime diagnostics
  globalSetup: require.resolve('./tests/e2e/helpers/global-setup'),

  // Global teardown - cleanup resources
  globalTeardown: require.resolve('./tests/e2e/helpers/global-teardown'),
});
