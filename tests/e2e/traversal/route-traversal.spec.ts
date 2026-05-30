import { test, expect } from '@playwright/test';
import { RouteTraversal } from '../helpers/route-traversal';
import { TraversalReporter } from '../reports/traversal-reporter';
import { ROUTE_METADATA, getCriticalRoutes } from '../fixtures/route-metadata';

test.describe('Route Traversal', () => {
    test('traverse critical routes', async ({ page }) => {
        const traversal = new RouteTraversal(page);
        const reporter = new TraversalReporter();

        // Get critical routes for initial traversal
        const criticalRoutes = getCriticalRoutes();
        const routes = criticalRoutes.map((r) => r.path);

        // Traverse routes
        const results = await traversal.traverseRoutes(routes);

        // Generate reports
        reporter.generateJsonReport(
            results,
            'tests/e2e/reports/traversal-critical.json',
        );
        reporter.generateMarkdownReport(
            results,
            'tests/e2e/reports/traversal-critical.md',
        );

        // Print terminal summary
        console.log(reporter.generateTerminalSummary(results));

        // Assert no critical failures
        const criticalFailures = results.flatMap((r) =>
            r.failures.filter((f) => f.category === 'critical'),
        );

        expect(criticalFailures.length).toBe(0);
    });

    test('traverse all core routes', async ({ page }) => {
        test.skip(true, 'Enable for full traversal - takes longer');

        const traversal = new RouteTraversal(page);
        const reporter = new TraversalReporter();

        // Get all core routes
        const coreRoutes = ROUTE_METADATA.filter((r) => r.category === 'core');
        const routes = coreRoutes.map((r) => r.path);

        // Traverse routes
        const results = await traversal.traverseRoutes(routes);

        // Generate reports
        reporter.generateJsonReport(
            results,
            'tests/e2e/reports/traversal-core.json',
        );
        reporter.generateMarkdownReport(
            results,
            'tests/e2e/reports/traversal-core.md',
        );

        // Print terminal summary
        console.log(reporter.generateTerminalSummary(results));

        // Assert all routes load successfully
        const failedRoutes = results.filter((r) => !r.success);
        expect(failedRoutes.length).toBe(0);
    });

    test('traverse dashboard route with telemetry', async ({ page }) => {
        const traversal = new RouteTraversal(page);

        // Traverse dashboard specifically
        const result = await traversal.traverseRoute('/dashboard');

        // Verify success
        expect(result.success).toBe(true);

        // Verify no console errors
        expect(result.telemetry.consoleErrors.length).toBe(0);

        // Verify no uncaught exceptions
        expect(result.telemetry.uncaughtExceptions.length).toBe(0);

        // Verify load time is reasonable (< 5 seconds)
        expect(result.loadDuration).toBeLessThan(5000);

        // Log telemetry for inspection
        console.log(
            'Dashboard telemetry:',
            JSON.stringify(result.telemetry, null, 2),
        );
    });
});
