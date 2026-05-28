import { Page } from '@playwright/test';
import { TestHelper } from './test-base';
import {
    RuntimeCollector,
    RuntimeTelemetry,
} from '../instrumentation/runtime-collector';
import { WidgetTestMetadata } from '../fixtures/widget-metadata';

export interface WidgetValidationResult {
    widgetId: string;
    success: boolean;
    renderDuration: number;
    telemetry: RuntimeTelemetry;
    failures: WidgetFailure[];
    metadata: WidgetTestMetadata | undefined;
}

export interface WidgetFailure {
    type:
        | 'mount'
        | 'shell'
        | 'loading'
        | 'empty'
        | 'error'
        | 'exception'
        | 'hydration'
        | 'performance';
    message: string;
    severity: 'error' | 'warning' | 'info';
    context?: Record<string, unknown>;
}

export class WidgetValidator {
    private helper: TestHelper;
    private collector: RuntimeCollector;

    constructor(private page: Page) {
        this.helper = new TestHelper(page);
        this.collector = new RuntimeCollector(page);
    }

    /**
     * Validate a single widget on the dashboard
     */
    async validateWidget(widgetId: string): Promise<WidgetValidationResult> {
        const metadata = await this.getWidgetMetadata(widgetId);

        // Skip if widget has skip reason
        if (metadata?.skipReason) {
            return {
                widgetId,
                success: true,
                renderDuration: 0,
                telemetry: this.collector.getTelemetry(),
                failures: [
                    {
                        type: 'mount',
                        message: `Skipped: ${metadata.skipReason}`,
                        severity: 'info',
                    },
                ],
                metadata,
            };
        }

        // Start telemetry collection
        this.collector.start(`widget-${widgetId}`);

        const startTime = Date.now();
        const failures: WidgetFailure[] = [];

        try {
            // Navigate to dashboard
            await this.helper.navigateToRoute('/dashboard');
            await this.helper.waitForStabilization();

            // Find widget element
            const widgetSelector = `[data-widget-id="${widgetId}"], [data-testid="widget-${widgetId}"]`;
            const widgetExists = await this.helper.exists(widgetSelector);

            if (!widgetExists) {
                failures.push({
                    type: 'mount',
                    message: `Widget ${widgetId} not found in DOM`,
                    severity: 'error',
                });
            } else {
                // Validate widget shell
                if (metadata?.validateShell) {
                    await this.validateWidgetShell(widgetSelector, failures);
                }

                // Validate loading state
                if (metadata?.validateLoading) {
                    await this.validateLoadingState(widgetSelector, failures);
                }

                // Validate empty state
                if (metadata?.validateEmpty) {
                    await this.validateEmptyState(widgetSelector, failures);
                }

                // Validate error state
                if (metadata?.validateError) {
                    await this.validateErrorState(widgetSelector, failures);
                }
            }

            const renderDuration = Date.now() - startTime;

            // Stop telemetry collection
            const telemetry = await this.collector.stop();

            // Analyze telemetry for widget-specific failures
            failures.push(...this.analyzeWidgetTelemetry(telemetry, widgetId));

            // Check performance against expected render time
            if (metadata && renderDuration > metadata.expectedRenderTime) {
                failures.push({
                    type: 'performance',
                    message: `Widget rendered in ${renderDuration}ms, expected ${metadata.expectedRenderTime}ms`,
                    severity: 'warning',
                    context: {
                        actual: renderDuration,
                        expected: metadata.expectedRenderTime,
                    },
                });
            }

            return {
                widgetId,
                success:
                    failures.filter((f) => f.severity === 'error').length === 0,
                renderDuration,
                telemetry,
                failures,
                metadata,
            };
        } catch (error) {
            const renderDuration = Date.now() - startTime;
            const telemetry = this.collector.getTelemetry();

            failures.push({
                type: 'exception',
                message:
                    error instanceof Error ? error.message : 'Unknown error',
                severity: 'error',
                context: { error },
            });

            return {
                widgetId,
                success: false,
                renderDuration,
                telemetry,
                failures,
                metadata,
            };
        }
    }

    /**
     * Validate multiple widgets
     */
    async validateWidgets(
        widgetIds: string[],
    ): Promise<WidgetValidationResult[]> {
        const results: WidgetValidationResult[] = [];

        for (const widgetId of widgetIds) {
            const result = await this.validateWidget(widgetId);
            results.push(result);
        }

        return results;
    }

    /**
     * Validate widget shell renders correctly
     */
    private async validateWidgetShell(
        selector: string,
        failures: WidgetFailure[],
    ): Promise<void> {
        try {
            // Check if widget shell is visible
            const isVisible = await this.helper.isVisible(selector);
            if (!isVisible) {
                failures.push({
                    type: 'shell',
                    message: 'Widget shell is not visible',
                    severity: 'error',
                });
            }

            // Check for widget header
            const headerSelector = `${selector} [data-testid="widget-header"], ${selector} .widget-header`;
            const hasHeader = await this.helper.exists(headerSelector);
            if (!hasHeader) {
                failures.push({
                    type: 'shell',
                    message: 'Widget header not found',
                    severity: 'warning',
                });
            }
        } catch (error) {
            failures.push({
                type: 'shell',
                message: `Shell validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: 'error',
            });
        }
    }

    /**
     * Validate loading state
     */
    private async validateLoadingState(
        selector: string,
        failures: WidgetFailure[],
    ): Promise<void> {
        try {
            // Check for loading indicators
            const loadingSelector = `${selector} [data-testid="loading"], ${selector} .loading, ${selector} .spinner`;
            // Loading state should be transient - wait a bit and check if it's gone
            await this.helper.exists(loadingSelector);
            await this.page.waitForTimeout(2000);
            const stillLoading = await this.helper.exists(loadingSelector);

            if (stillLoading) {
                failures.push({
                    type: 'loading',
                    message: 'Widget stuck in loading state',
                    severity: 'error',
                });
            }
        } catch (error) {
            failures.push({
                type: 'loading',
                message: `Loading state validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: 'warning',
            });
        }
    }

    /**
     * Validate empty state
     */
    private async validateEmptyState(
        selector: string,
        failures: WidgetFailure[],
    ): Promise<void> {
        try {
            // Check for empty state indicators
            const emptySelector = `${selector} [data-testid="empty"], ${selector} .empty-state, ${selector} .no-data`;
            const hasEmpty = await this.helper.exists(emptySelector);

            if (hasEmpty) {
                // Empty state is valid if widget has no data
                // This is informational, not a failure
                failures.push({
                    type: 'empty',
                    message: 'Widget in empty state (no data)',
                    severity: 'info',
                });
            }
        } catch (error) {
            failures.push({
                type: 'empty',
                message: `Empty state validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: 'warning',
            });
        }
    }

    /**
     * Validate error state
     */
    private async validateErrorState(
        selector: string,
        failures: WidgetFailure[],
    ): Promise<void> {
        try {
            // Check for error state indicators
            const errorSelector = `${selector} [data-testid="error"], ${selector} .error-state, ${selector} .error-message`;
            const hasError = await this.helper.exists(errorSelector);

            if (hasError) {
                const errorText = await this.helper.getText(errorSelector);
                failures.push({
                    type: 'error',
                    message: `Widget in error state: ${errorText || 'Unknown error'}`,
                    severity: 'error',
                });
            }
        } catch (error) {
            failures.push({
                type: 'error',
                message: `Error state validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: 'warning',
            });
        }
    }

    /**
     * Analyze telemetry for widget-specific failures
     */
    private analyzeWidgetTelemetry(
        telemetry: RuntimeTelemetry,
        widgetId: string,
    ): WidgetFailure[] {
        const failures: WidgetFailure[] = [];

        // Console errors related to this widget
        for (const error of telemetry.consoleErrors) {
            if (error.message.toLowerCase().includes(widgetId.toLowerCase())) {
                failures.push({
                    type: 'exception',
                    message: `Widget console error: ${error.message}`,
                    severity: 'error',
                    context: { timestamp: error.timestamp },
                });
            }
        }

        // Hydration warnings related to this widget
        for (const warning of telemetry.hydrationWarnings) {
            if (
                warning.message.toLowerCase().includes(widgetId.toLowerCase())
            ) {
                failures.push({
                    type: 'hydration',
                    message: `Widget hydration warning: ${warning.message}`,
                    severity: 'warning',
                    context: { timestamp: warning.timestamp },
                });
            }
        }

        return failures;
    }

    /**
     * Get widget metadata
     */
    private async getWidgetMetadata(
        widgetId: string,
    ): Promise<WidgetTestMetadata | undefined> {
        // Import dynamically to avoid circular dependencies
        const { getWidgetTestMetadata } =
            await import('../fixtures/widget-metadata');
        return getWidgetTestMetadata(widgetId);
    }

    /**
     * Get summary of validation results
     */
    getSummary(results: WidgetValidationResult[]): {
        total: number;
        successful: number;
        failed: number;
        skipped: number;
        failuresByType: Record<string, number>;
        averageRenderTime: number;
        slowestWidgets: Array<{ widgetId: string; duration: number }>;
    } {
        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;
        const skipped = results.filter((r) => r.metadata?.skipReason).length;
        const total = results.length;

        const failuresByType: Record<string, number> = {};

        for (const result of results) {
            for (const failure of result.failures) {
                failuresByType[failure.type] =
                    (failuresByType[failure.type] || 0) + 1;
            }
        }

        const averageRenderTime =
            results.length > 0
                ? results.reduce((sum, r) => sum + r.renderDuration, 0) /
                  results.length
                : 0;

        const slowestWidgets = results
            .map((r) => ({ widgetId: r.widgetId, duration: r.renderDuration }))
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5);

        return {
            total,
            successful,
            failed,
            skipped,
            failuresByType,
            averageRenderTime,
            slowestWidgets,
        };
    }
}
