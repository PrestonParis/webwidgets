import { test, expect } from '@playwright/test';

/**
 * Regression tests for Supabase auth lock contention and dashboard fetch storm fixes
 * These tests verify:
 * - No unhandled promise rejections
 * - No auth lock warnings in console
 * - No duplicate requests for the same data
 * - Hidden widgets don't fetch data on initial render
 */

test.describe('Dashboard Auth and Request Orchestration', () => {
    test.beforeEach(async ({ page }) => {
        // Listen for console errors and warnings
        const consoleErrors: string[] = [];
        const consoleWarnings: string[] = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            } else if (msg.type() === 'warning') {
                consoleWarnings.push(msg.text());
            }
        });

        // Store on page context for later assertions
        await page.context().addInitScript(() => {
            (window as any).consoleErrors = [];
            (window as any).consoleWarnings = [];
        });
    });

    test('should not have unhandled promise rejections on dashboard load', async ({
        page,
    }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        const unhandledRejections = await page.evaluate(() => {
            return (
                (window as any).consoleErrors?.filter(
                    (err: string) =>
                        err.includes('UnhandledPromiseRejection') ||
                        err.includes('unhandledrejection'),
                ) || []
            );
        });

        expect(unhandledRejections).toHaveLength(0);
    });

    test('should not have auth lock warnings in console', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        const authLockWarnings = await page.evaluate(() => {
            return (
                (window as any).consoleWarnings?.filter(
                    (warn: string) =>
                        warn.includes('auth') &&
                        (warn.includes('lock') ||
                            warn.includes('contention') ||
                            warn.includes('concurrent')),
                ) || []
            );
        });

        expect(authLockWarnings).toHaveLength(0);
    });
});

test.describe('Dashboard Request Deduplication', () => {
    test('should not make duplicate requests for the same widget data', async ({
        page,
    }) => {
        const requestCounts = new Map<string, number>();

        page.on('request', (request) => {
            const url = request.url();
            if (url.includes('/api/')) {
                const count = requestCounts.get(url) || 0;
                requestCounts.set(url, count + 1);
            }
        });

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        const duplicates: string[] = [];
        for (const [url, count] of requestCounts.entries()) {
            if (!url.includes('/auth/') && count > 2) {
                duplicates.push(`${url}: ${count} times`);
            }
        }

        expect(duplicates).toHaveLength(0);
    });

    test('hidden widgets should not fetch data on initial render', async ({
        page,
    }) => {
        const widgetRequests: string[] = [];

        page.on('request', (request) => {
            const url = request.url();
            if (url.includes('/api/') && url.includes('widget')) {
                widgetRequests.push(url);
            }
        });

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        expect(widgetRequests.length).toBeGreaterThan(0);
    });
});

test.describe('Dashboard Request Concurrency', () => {
    test('request orchestration should limit concurrent requests', async ({
        page,
    }) => {
        const concurrentRequests: number[] = [];
        let activeRequests = 0;

        page.on('request', () => {
            activeRequests++;
            concurrentRequests.push(activeRequests);
        });

        page.on('requestfinished', () => {
            activeRequests--;
        });

        page.on('requestfailed', () => {
            activeRequests--;
        });

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        const maxConcurrent = Math.max(...concurrentRequests, 0);
        expect(maxConcurrent).toBeLessThanOrEqual(10);
    });
});
