import { Page, expect } from '@playwright/test';

/**
 * Base test helper with common utilities
 */
export class TestHelper {
  constructor(protected page: Page) {}

  /**
   * Wait for app stabilization
   * Waits for network idle and hydration to complete
   */
  async waitForStabilization(timeout = 10000): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState('networkidle', { timeout }),
      this.page.waitForLoadState('domcontentloaded', { timeout }),
    ]);

    // Additional wait for React hydration
    await this.page.waitForTimeout(500);
  }

  /**
   * Navigate to a route and wait for stabilization
   */
  async navigateToRoute(route: string): Promise<void> {
    await this.page.goto(route);
    await this.waitForStabilization();
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if element exists in DOM
   */
  async exists(selector: string): Promise<boolean> {
    const element = await this.page.locator(selector).count();
    return element > 0;
  }

  /**
   * Get text content of element
   */
  async getText(selector: string): Promise<string | null> {
    const element = await this.page.locator(selector).first();
    return await element.textContent();
  }

  /**
   * Click element safely
   */
  async click(selector: string): Promise<void> {
    await this.page.locator(selector).first().click();
  }

  /**
   * Fill input safely
   */
  async fill(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).first().fill(value);
  }

  /**
   * Take screenshot with context
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `tests/e2e/artifacts/${name}.png` });
  }

  /**
   * Get console errors
   */
  getConsoleErrors(): string[] {
    const errors: string[] = [];
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }

  /**
   * Get page performance metrics
   */
  async getPerformanceMetrics(): Promise<Record<string, number>> {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        ttfb: navigation.responseStart - navigation.requestStart,
      };
    });
    return metrics;
  }
}
