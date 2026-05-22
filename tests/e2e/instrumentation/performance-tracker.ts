import { Page } from '@playwright/test';
import { RuntimeCollector, RuntimeTelemetry } from './runtime-collector';

export interface PerformanceMetrics {
  ttfb: number;
  hydrationDuration: number;
  apiLatency: number;
  widgetRenderDuration: number;
  dashboardSnapshotDuration: number;
  longRequests: number;
  duplicateRequests: number;
  slowSuspenseBoundaries: number;
}

export interface PerformanceThresholds {
  ttfb: number;
  hydrationDuration: number;
  apiLatency: number;
  widgetRenderDuration: number;
  dashboardSnapshotDuration: number;
  longRequestThreshold: number;
  duplicateRequestThreshold: number;
}

export class PerformanceTracker {
  private collector: RuntimeCollector;
  private thresholds: PerformanceThresholds = {
    ttfb: 1000, // 1 second
    hydrationDuration: 2000, // 2 seconds
    apiLatency: 500, // 500ms
    widgetRenderDuration: 3000, // 3 seconds
    dashboardSnapshotDuration: 5000, // 5 seconds
    longRequestThreshold: 1000, // 1 second
    duplicateRequestThreshold: 2, // More than 2 duplicates
  };

  constructor(private page: Page) {
    this.collector = new RuntimeCollector(page);
  }

  /**
   * Set custom thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Start performance tracking
   */
  start(route: string): void {
    this.collector.start(route);
  }

  /**
   * Stop performance tracking and return metrics
   */
  async stop(): Promise<PerformanceMetrics> {
    const telemetry = await this.collector.stop();
    return this.extractMetrics(telemetry);
  }

  /**
   * Extract performance metrics from telemetry
   */
  private extractMetrics(telemetry: RuntimeTelemetry): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      ttfb: telemetry.performanceMetrics.ttfb,
      hydrationDuration: telemetry.performanceMetrics.domContentLoaded,
      apiLatency: this.calculateAverageApiLatency(telemetry.networkWaterfall),
      widgetRenderDuration: this.calculateWidgetRenderDuration(telemetry.networkWaterfall),
      dashboardSnapshotDuration: this.calculateDashboardSnapshotDuration(telemetry.networkWaterfall),
      longRequests: telemetry.networkWaterfall.filter(r => r.duration > this.thresholds.longRequestThreshold).length,
      duplicateRequests: telemetry.duplicateRequests.length,
      slowSuspenseBoundaries: this.detectSlowSuspenseBoundaries(telemetry),
    };

    return metrics;
  }

  /**
   * Calculate average API latency
   */
  private calculateAverageApiLatency(waterfall: RuntimeTelemetry['networkWaterfall']): number {
    const apiRequests = waterfall.filter(r => r.url.includes('/api/'));
    if (apiRequests.length === 0) return 0;
    
    const totalLatency = apiRequests.reduce((sum, r) => sum + r.duration, 0);
    return totalLatency / apiRequests.length;
  }

  /**
   * Calculate widget render duration
   */
  private calculateWidgetRenderDuration(waterfall: RuntimeTelemetry['networkWaterfall']): number {
    const widgetRequests = waterfall.filter(r => r.url.includes('/api/widgets') || r.url.includes('/api/dashboard'));
    if (widgetRequests.length === 0) return 0;
    
    const totalDuration = widgetRequests.reduce((sum, r) => sum + r.duration, 0);
    return totalDuration;
  }

  /**
   * Calculate dashboard snapshot duration
   */
  private calculateDashboardSnapshotDuration(waterfall: RuntimeTelemetry['networkWaterfall']): number {
    const snapshotRequests = waterfall.filter(r => r.url.includes('/api/dashboard/snapshot'));
    if (snapshotRequests.length === 0) return 0;
    
    return snapshotRequests.reduce((sum, r) => sum + r.duration, 0);
  }

  /**
   * Detect slow Suspense boundaries
   */
  private detectSlowSuspenseBoundaries(telemetry: RuntimeTelemetry): number {
    // This is a heuristic - in a real implementation, you'd need to instrument
    // the React Suspense boundaries to measure their resolve time
    // For now, we'll count long tasks that might indicate slow Suspense
    return telemetry.longTasks.filter(t => t.duration > 100).length;
  }

  /**
   * Check if metrics exceed thresholds
   */
  checkThresholds(metrics: PerformanceMetrics): Record<string, { actual: number; threshold: number; exceeded: boolean }> {
    return {
      ttfb: {
        actual: metrics.ttfb,
        threshold: this.thresholds.ttfb,
        exceeded: metrics.ttfb > this.thresholds.ttfb,
      },
      hydrationDuration: {
        actual: metrics.hydrationDuration,
        threshold: this.thresholds.hydrationDuration,
        exceeded: metrics.hydrationDuration > this.thresholds.hydrationDuration,
      },
      apiLatency: {
        actual: metrics.apiLatency,
        threshold: this.thresholds.apiLatency,
        exceeded: metrics.apiLatency > this.thresholds.apiLatency,
      },
      widgetRenderDuration: {
        actual: metrics.widgetRenderDuration,
        threshold: this.thresholds.widgetRenderDuration,
        exceeded: metrics.widgetRenderDuration > this.thresholds.widgetRenderDuration,
      },
      dashboardSnapshotDuration: {
        actual: metrics.dashboardSnapshotDuration,
        threshold: this.thresholds.dashboardSnapshotDuration,
        exceeded: metrics.dashboardSnapshotDuration > this.thresholds.dashboardSnapshotDuration,
      },
      longRequests: {
        actual: metrics.longRequests,
        threshold: 0, // Any long request is notable
        exceeded: metrics.longRequests > 0,
      },
      duplicateRequests: {
        actual: metrics.duplicateRequests,
        threshold: this.thresholds.duplicateRequestThreshold,
        exceeded: metrics.duplicateRequests > this.thresholds.duplicateRequestThreshold,
      },
    };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(metrics: PerformanceMetrics, thresholdCheck: ReturnType<typeof this.checkThresholds>): string {
    const lines: string[] = [];

    lines.push('# Performance Report');
    lines.push('');
    lines.push('## Metrics');
    lines.push('');
    lines.push('| Metric | Value | Threshold | Exceeded |');
    lines.push('|--------|-------|-----------|----------|');
    
    for (const [key, value] of Object.entries(thresholdCheck)) {
      const status = value.exceeded ? '❌ YES' : '✅ NO';
      lines.push(`| ${key} | ${value.actual.toFixed(2)}ms | ${value.threshold}ms | ${status} |`);
    }

    lines.push('');
    lines.push('## Analysis');
    lines.push('');

    const exceededMetrics = Object.entries(thresholdCheck).filter(([_, v]) => v.exceeded);
    if (exceededMetrics.length > 0) {
      lines.push('### Performance Regressions Detected');
      lines.push('');
      for (const [key, value] of exceededMetrics) {
        lines.push(`- **${key}**: ${value.actual.toFixed(2)}ms exceeds threshold of ${value.threshold}ms`);
      }
    } else {
      lines.push('✅ All performance metrics within acceptable thresholds');
    }

    return lines.join('\n');
  }
}
