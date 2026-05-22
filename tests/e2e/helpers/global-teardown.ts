import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright tests
 * 
 * This runs after all tests and:
 * - Stops managed server if it was started
 * - Cleans up resources
 * - Generates final reports
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up after Playwright test suite...');
  
  // Cleanup runtime manager if it was stored
  const runtimeManager = (global as any).__runtimeManager;
  if (runtimeManager) {
    await runtimeManager.cleanup();
  }
  
  console.log('✅ Playwright test suite complete');
}

export default globalTeardown;
