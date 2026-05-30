import { Page } from '@playwright/test';

/**
 * Runtime telemetry collector
 * Collects console errors, failed requests, hydration warnings, etc.
 */
export interface RuntimeTelemetry {
    route: string;
    timestamp: number;
    consoleErrors: ConsoleError[];
    failedRequests: FailedRequest[];
    hydrationWarnings: HydrationWarning[];
    uncaughtExceptions: UncaughtException[];
    networkWaterfall: NetworkEntry[];
    duplicateRequests: DuplicateRequest[];
    longTasks: LongTask[];
    performanceMetrics: PerformanceMetrics;
}

export interface ConsoleError {
    message: string;
    timestamp: number;
}

export interface FailedRequest {
    url: string;
    method: string;
    status: number;
    timestamp: number;
}

export interface HydrationWarning {
    message: string;
    timestamp: number;
}

export interface UncaughtException {
    message: string;
    timestamp: number;
}

export interface NetworkEntry {
    url: string;
    method: string;
    duration: number;
    status: number;
    timestamp: number;
}

export interface DuplicateRequest {
    url: string;
    method: string;
    count: number;
    firstTimestamp: number;
    lastTimestamp: number;
}

export interface LongTask {
    duration: number;
    startTime: number;
}

export interface PerformanceMetrics {
    ttfb: number;
    domContentLoaded: number;
    loadComplete: number;
    firstContentfulPaint: number | undefined;
    largestContentfulPaint: number | undefined;
}

export class RuntimeCollector {
    private telemetry: RuntimeTelemetry = {
        route: '',
        timestamp: 0,
        consoleErrors: [],
        failedRequests: [],
        hydrationWarnings: [],
        uncaughtExceptions: [],
        networkWaterfall: [],
        duplicateRequests: [],
        longTasks: [],
        performanceMetrics: {
            ttfb: 0,
            domContentLoaded: 0,
            loadComplete: 0,
            firstContentfulPaint: undefined,
            largestContentfulPaint: undefined,
        },
    };

    private requestMap = new Map<string, NetworkEntry[]>();
    private consoleErrors: ConsoleError[] = [];
    private hydrationWarnings: HydrationWarning[] = [];
    private uncaughtExceptions: UncaughtException[] = [];

    constructor(private page: Page) {
        this.setupListeners();
    }

    private setupListeners(): void {
        // Console errors
        this.page.on('console', (msg) => {
            if (msg.type() === 'error') {
                this.consoleErrors.push({
                    message: msg.text(),
                    timestamp: Date.now(),
                });
            }

            // Hydration warnings
            const text = msg.text();
            if (text.includes('hydration') || text.includes('Hydration')) {
                this.hydrationWarnings.push({
                    message: text,
                    timestamp: Date.now(),
                });
            }
        });

        // Page errors
        this.page.on('pageerror', (error) => {
            this.uncaughtExceptions.push({
                message: error.message,
                timestamp: Date.now(),
            });
        });

        // Request/response tracking
        this.page.on('response', async (response) => {
            const url = response.url();
            const method = response.request().method();
            const status = response.status();

            // Skip non-HTTP requests
            if (!url.startsWith('http')) return;

            // Calculate duration from timing if available
            const timing = response.request().timing();
            const duration = timing ? timing.responseEnd - timing.startTime : 0;
            const timestamp = timing ? timing.startTime : Date.now();

            const entry: NetworkEntry = {
                url,
                method,
                duration,
                status,
                timestamp,
            };

            this.telemetry.networkWaterfall.push(entry);

            // Track for duplicate detection
            const key = `${method}:${url}`;
            const entries = this.requestMap.get(key) || [];
            entries.push(entry);
            this.requestMap.set(key, entries);

            // Track failed requests
            if (status >= 400) {
                this.telemetry.failedRequests.push({
                    url,
                    method,
                    status,
                    timestamp,
                });
            }
        });

        // Long task detection
        this.page.on('requestfinished', (request) => {
            const timing = request.timing();
            if (timing && timing.responseEnd > 0) {
                const duration = timing.responseEnd - timing.startTime;
                if (duration > 50) {
                    // 50ms threshold
                    this.telemetry.longTasks.push({
                        duration,
                        startTime: timing.startTime,
                    });
                }
            }
        });
    }

    /**
     * Start collecting telemetry for a route
     */
    start(route: string): void {
        this.telemetry = {
            route,
            timestamp: Date.now(),
            consoleErrors: [],
            failedRequests: [],
            hydrationWarnings: [],
            uncaughtExceptions: [],
            networkWaterfall: [],
            duplicateRequests: [],
            longTasks: [],
            performanceMetrics: {
                ttfb: 0,
                domContentLoaded: 0,
                loadComplete: 0,
                firstContentfulPaint: undefined,
                largestContentfulPaint: undefined,
            },
        };
        this.consoleErrors = [];
        this.hydrationWarnings = [];
        this.uncaughtExceptions = [];
        this.requestMap.clear();
    }

    /**
     * Stop collecting and return telemetry
     */
    async stop(): Promise<RuntimeTelemetry> {
        this.telemetry.consoleErrors = this.consoleErrors;
        this.telemetry.hydrationWarnings = this.hydrationWarnings;
        this.telemetry.uncaughtExceptions = this.uncaughtExceptions;
        this.telemetry.duplicateRequests = this.detectDuplicates();

        // Collect performance metrics
        this.telemetry.performanceMetrics =
            await this.collectPerformanceMetrics();

        return this.telemetry;
    }

    /**
     * Detect duplicate requests
     */
    private detectDuplicates(): DuplicateRequest[] {
        const duplicates: DuplicateRequest[] = [];

        for (const [key, entries] of this.requestMap.entries()) {
            if (entries.length > 1) {
                const parts = key.split(':');
                const method = parts[0] ?? 'GET';
                const url = parts.slice(1).join(':') || '';
                const firstEntry = entries[0];
                const lastEntry = entries[entries.length - 1];

                if (firstEntry && lastEntry) {
                    duplicates.push({
                        url,
                        method,
                        count: entries.length,
                        firstTimestamp: firstEntry.timestamp,
                        lastTimestamp: lastEntry.timestamp,
                    });
                }
            }
        }

        return duplicates;
    }

    /**
     * Collect performance metrics
     */
    private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
        const metrics = await this.page.evaluate(() => {
            const navigation = performance.getEntriesByType(
                'navigation',
            )[0] as PerformanceNavigationTiming;
            const paint = performance.getEntriesByType('paint');

            const fcp = paint.find((p) => p.name === 'first-contentful-paint');
            const lcp = performance.getEntriesByType(
                'largest-contentful-paint',
            )[0];

            return {
                ttfb: navigation.responseStart - navigation.requestStart,
                domContentLoaded:
                    navigation.domContentLoadedEventEnd -
                    navigation.domContentLoadedEventStart,
                loadComplete:
                    navigation.loadEventEnd - navigation.loadEventStart,
                firstContentfulPaint: fcp ? fcp.startTime : undefined,
                largestContentfulPaint: lcp ? lcp.startTime : undefined,
            };
        });

        return {
            ttfb: metrics.ttfb,
            domContentLoaded: metrics.domContentLoaded,
            loadComplete: metrics.loadComplete,
            firstContentfulPaint: metrics.firstContentfulPaint,
            largestContentfulPaint: metrics.largestContentfulPaint,
        };
    }

    /**
     * Get current telemetry without stopping
     */
    getTelemetry(): RuntimeTelemetry {
        return {
            ...this.telemetry,
            consoleErrors: this.consoleErrors,
            hydrationWarnings: this.hydrationWarnings,
            uncaughtExceptions: this.uncaughtExceptions,
            duplicateRequests: this.detectDuplicates(),
        };
    }
}
