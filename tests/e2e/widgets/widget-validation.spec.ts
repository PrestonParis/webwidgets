import { test, expect } from '@playwright/test';
import { WidgetValidator } from '../helpers/widget-validator';
import { getCriticalWidgets } from '../fixtures/widget-metadata';

test.describe('Widget Validation', () => {
    test('validate critical widgets', async ({ page }) => {
        const validator = new WidgetValidator(page);

        // Get critical widgets
        const criticalWidgets = getCriticalWidgets();
        const widgetIds = criticalWidgets.map((w) => w.id);

        // Validate widgets
        const results = await validator.validateWidgets(widgetIds);

        // Get summary
        const summary = validator.getSummary(results);

        console.log(
            'Widget Validation Summary:',
            JSON.stringify(summary, null, 2),
        );

        // Assert all critical widgets validate successfully
        const failedWidgets = results.filter((r) => !r.success);
        expect(failedWidgets.length).toBe(0);
    });

    test('validate single widget - finance', async ({ page }) => {
        const validator = new WidgetValidator(page);

        // Validate finance widget specifically
        const result = await validator.validateWidget('finance');

        // Verify success
        expect(result.success).toBe(true);

        // Verify no critical failures
        const criticalFailures = result.failures.filter(
            (f) => f.severity === 'error',
        );
        expect(criticalFailures.length).toBe(0);

        // Verify render time is reasonable
        expect(result.renderDuration).toBeLessThan(5000);

        console.log(
            'Finance widget validation:',
            JSON.stringify(result, null, 2),
        );
    });

    test('validate single widget - calendar', async ({ page }) => {
        const validator = new WidgetValidator(page);

        // Validate calendar widget specifically
        const result = await validator.validateWidget('calendar');

        // Verify success
        expect(result.success).toBe(true);

        // Verify no critical failures
        const criticalFailures = result.failures.filter(
            (f) => f.severity === 'error',
        );
        expect(criticalFailures.length).toBe(0);

        console.log(
            'Calendar widget validation:',
            JSON.stringify(result, null, 2),
        );
    });
});
