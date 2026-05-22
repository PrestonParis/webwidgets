import { Page } from '@playwright/test';
import { TestHelper } from './test-base';
import { RuntimeCollector, RuntimeTelemetry } from '../instrumentation/runtime-collector';
import { RouteMetadata, getRouteMetadata } from '../fixtures/route-metadata';

export interface TraversalResult {
  route: string;
  success: boolean;
  loadDuration: number;
  telemetry: RuntimeTelemetry;
  failures: Failure[];
  metadata: RouteMetadata | undefined;
}

export type FailureCategory = 
  | 'infrastructure'  // Runtime unavailable, startup failure, port conflict
  | 'critical'       // App crashes, auth failures, core routes broken
  | 'degraded'       // Slow loads, degraded integrations, partial failures
  | 'cosmetic'       // Visual issues, minor UI problems
  | 'performance'    // Performance regressions, slow routes/widgets
  | 'hydration'      // Hydration mismatches, client/server render issues
  | 'network'        // Failed requests, network errors, duplicate requests
  | 'missing-data'   // Missing data, empty states without fallbacks
  | 'placeholder/slop'; // Placeholder content, fake data, TODOs in UI

export interface Failure {
  category: FailureCategory;
  message: string;
  severity: 'error' | 'warning' | 'info';
  context?: Record<string, unknown>;
}

export class RouteTraversal {
  private helper: TestHelper;
  private collector: RuntimeCollector;

  constructor(private page: Page) {
    this.helper = new TestHelper(page);
    this.collector = new RuntimeCollector(page);
  }

  /**
   * Traverse a single route and collect telemetry
   */
  async traverseRoute(route: string): Promise<TraversalResult> {
    const metadata = getRouteMetadata(route);
    
    // Skip if route has skip reason
    if (metadata?.skipReason) {
      return {
        route,
        success: true,
        loadDuration: 0,
        telemetry: this.collector.getTelemetry(),
        failures: [{
          category: 'cosmetic',
          message: `Skipped: ${metadata.skipReason}`,
          severity: 'info',
        }],
        metadata,
      };
    }

    // Start telemetry collection
    this.collector.start(route);

    const startTime = Date.now();
    const failures: Failure[] = [];

    try {
      // Navigate to route
      await this.helper.navigateToRoute(route);

      // Wait for stabilization
      await this.helper.waitForStabilization();

      const loadDuration = Date.now() - startTime;

      // Stop telemetry collection
      const telemetry = await this.collector.stop();

      // Analyze telemetry for failures
      failures.push(...this.analyzeTelemetry(telemetry, metadata));

      // Check performance against expected load time
      if (metadata && loadDuration > metadata.expectedLoadTime) {
        failures.push({
          category: 'performance',
          message: `Route loaded in ${loadDuration}ms, expected ${metadata.expectedLoadTime}ms`,
          severity: 'warning',
          context: { actual: loadDuration, expected: metadata.expectedLoadTime },
        });
      }

      return {
        route,
        success: failures.filter(f => f.severity === 'error').length === 0,
        loadDuration,
        telemetry,
        failures,
        metadata,
      };
    } catch (error) {
      const loadDuration = Date.now() - startTime;
      const telemetry = this.collector.getTelemetry();

      failures.push({
        category: 'critical',
        message: error instanceof Error ? error.message : 'Unknown error',
        severity: 'error',
        context: { error },
      });

      return {
        route,
        success: false,
        loadDuration,
        telemetry,
        failures,
        metadata,
      };
    }
  }

  /**
   * Traverse multiple routes
   */
  async traverseRoutes(routes: string[]): Promise<TraversalResult[]> {
    const results: TraversalResult[] = [];

    for (const route of routes) {
      const result = await this.traverseRoute(route);
      results.push(result);
    }

    return results;
  }

  /**
   * Analyze telemetry for failures
   */
  private analyzeTelemetry(telemetry: RuntimeTelemetry, metadata?: RouteMetadata): Failure[] {
    const failures: Failure[] = [];

    // Console errors
    for (const error of telemetry.consoleErrors) {
      // Distinguish infrastructure errors from app errors
      if (this.isInfrastructureError(error.message)) {
        failures.push({
          category: 'infrastructure',
          message: `Infrastructure error: ${error.message}`,
          severity: 'error',
          context: { timestamp: error.timestamp },
        });
      } else {
        failures.push({
          category: 'critical',
          message: `Console error: ${error.message}`,
          severity: 'error',
          context: { timestamp: error.timestamp },
        });
      }
    }

    // Failed requests
    for (const request of telemetry.failedRequests) {
      // Distinguish infrastructure failures (connection refused, DNS errors) from app failures
      if (this.isInfrastructureFailure(request.status, request.url)) {
        failures.push({
          category: 'infrastructure',
          message: `Infrastructure failure: ${request.method} ${request.url} (${request.status})`,
          severity: 'error',
          context: { url: request.url, method: request.method, status: request.status },
        });
      } else {
        failures.push({
          category: 'network',
          message: `Failed request: ${request.method} ${request.url} (${request.status})`,
          severity: 'error',
          context: { url: request.url, method: request.method, status: request.status },
        });
      }
    }

    // Hydration warnings
    for (const warning of telemetry.hydrationWarnings) {
      failures.push({
        category: 'hydration',
        message: `Hydration warning: ${warning.message}`,
        severity: 'warning',
        context: { timestamp: warning.timestamp },
      });
    }

    // Uncaught exceptions
    for (const exception of telemetry.uncaughtExceptions) {
      failures.push({
        category: 'critical',
        message: `Uncaught exception: ${exception.message}`,
        severity: 'error',
        context: { timestamp: exception.timestamp },
      });
    }

    // Duplicate requests
    for (const duplicate of telemetry.duplicateRequests) {
      failures.push({
        category: 'network',
        message: `Duplicate request: ${duplicate.method} ${duplicate.url} (${duplicate.count} times)`,
        severity: 'warning',
        context: { 
          url: duplicate.url, 
          method: duplicate.method, 
          count: duplicate.count,
          firstTimestamp: duplicate.firstTimestamp,
          lastTimestamp: duplicate.lastTimestamp,
        },
      });
    }

    // Long tasks
    for (const task of telemetry.longTasks) {
      failures.push({
        category: 'performance',
        message: `Long task detected: ${task.duration}ms`,
        severity: 'warning',
        context: { duration: task.duration, startTime: task.startTime },
      });
    }

    return failures;
  }

  /**
   * Check if error message indicates infrastructure issue
   */
  private isInfrastructureError(message: string): boolean {
    const infrastructurePatterns = [
      /ECONNREFUSED/i,
      /ENOTFOUND/i,
      /ETIMEDOUT/i,
      /connection refused/i,
      /network unreachable/i,
      /fetch failed/i,
      /server unavailable/i,
    ];
    return infrastructurePatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if failed request indicates infrastructure failure
   */
  private isInfrastructureFailure(status: number, url: string): boolean {
    // Connection-level failures
    if (status === 0 || status === -1) return true;
    
    // DNS failures
    if (url.includes('localhost') && status >= 500) return true;
    
    return false;
  }

  /**
   * Get summary of traversal results
   */
  getSummary(results: TraversalResult[]): {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
    failuresByCategory: Record<FailureCategory, number>;
    averageLoadTime: number;
    slowestRoutes: Array<{ route: string; duration: number }>;
  } {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const skipped = results.filter(r => r.metadata?.skipReason).length;
    const total = results.length;

    const failuresByCategory: Record<FailureCategory, number> = {
      infrastructure: 0,
      critical: 0,
      degraded: 0,
      cosmetic: 0,
      performance: 0,
      hydration: 0,
      network: 0,
      'missing-data': 0,
      'placeholder/slop': 0,
    };

    for (const result of results) {
      for (const failure of result.failures) {
        failuresByCategory[failure.category]++;
      }
    }

    const averageLoadTime = results.reduce((sum, r) => sum + r.loadDuration, 0) / total;

    const slowestRoutes = results
      .map(r => ({ route: r.route, duration: r.loadDuration }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    return {
      total,
      successful,
      failed,
      skipped,
      failuresByCategory,
      averageLoadTime,
      slowestRoutes,
    };
  }
}
