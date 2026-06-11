import * as fs from 'fs';
import * as path from 'path';
import { TraversalResult, FailureCategory } from '../helpers/route-traversal';

// Re-export to ensure type consistency
export type { FailureCategory };

export interface TraversalReport {
    timestamp: string;
    summary: {
        total: number;
        successful: number;
        failed: number;
        skipped: number;
        failuresByCategory: Record<FailureCategory, number>;
        averageLoadTime: number;
        slowestRoutes: Array<{ route: string; duration: number }>;
    };
    results: TraversalResult[];
}

export class TraversalReporter {
    /**
     * Generate JSON report
     */
    generateJsonReport(results: TraversalResult[], outputPath: string): void {
        const summary = this.calculateSummary(results);
        const report: TraversalReport = {
            timestamp: new Date().toISOString(),
            summary,
            results,
        };

        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    }

    /**
     * Generate Markdown report
     */
    generateMarkdownReport(
        results: TraversalResult[],
        outputPath: string,
    ): void {
        const summary = this.calculateSummary(results);
        const markdown = this.formatMarkdown(results, summary);

        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, markdown);
    }

    /**
     * Generate terminal summary
     */
    generateTerminalSummary(results: TraversalResult[]): string {
        const summary = this.calculateSummary(results);
        const lines: string[] = [];

        lines.push('='.repeat(60));
        lines.push('TRAVERSAL REPORT');
        lines.push('='.repeat(60));
        lines.push('');
        lines.push(`Timestamp: ${new Date().toISOString()}`);
        lines.push('');
        lines.push('SUMMARY');
        lines.push('-'.repeat(60));
        lines.push(`Total Routes: ${summary.total}`);
        lines.push(`Successful: ${summary.successful} ✓`);
        lines.push(`Failed: ${summary.failed} ✗`);
        lines.push(`Skipped: ${summary.skipped} ⊘`);
        lines.push(
            `Average Load Time: ${Math.round(summary.averageLoadTime)}ms`,
        );
        lines.push('');
        lines.push('FAILURES BY CATEGORY');
        lines.push('-'.repeat(60));
        for (const [category, count] of Object.entries(
            summary.failuresByCategory,
        )) {
            if (count > 0) {
                lines.push(`${category}: ${count}`);
            }
        }
        lines.push('');
        lines.push('SLOWEST ROUTES');
        lines.push('-'.repeat(60));
        for (const { route, duration } of summary.slowestRoutes) {
            lines.push(`${route}: ${duration}ms`);
        }
        lines.push('');
        lines.push('FAILED ROUTES');
        lines.push('-'.repeat(60));
        for (const result of results) {
            if (!result.success) {
                lines.push(`✗ ${result.route}`);
                for (const failure of result.failures) {
                    lines.push(`  [${failure.category}] ${failure.message}`);
                }
            }
        }
        lines.push('');
        lines.push('='.repeat(60));

        return lines.join('\n');
    }

    /**
     * Calculate summary statistics
     */
    private calculateSummary(results: TraversalResult[]) {
        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;
        const skipped = results.filter((r) => r.metadata?.skipReason).length;
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

        const averageLoadTime =
            results.length > 0
                ? results.reduce((sum, r) => sum + r.loadDuration, 0) /
                  results.length
                : 0;

        const slowestRoutes = results
            .map((r) => ({ route: r.route, duration: r.loadDuration }))
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

    /**
     * Format results as Markdown
     */
    private formatMarkdown(results: TraversalResult[], summary: any): string {
        const lines: string[] = [];

        lines.push('# Traversal Report');
        lines.push('');
        lines.push(`**Generated:** ${new Date().toISOString()}`);
        lines.push('');

        lines.push('## Summary');
        lines.push('');
        lines.push('| Metric | Value |');
        lines.push('|--------|-------|');
        lines.push(`| Total Routes | ${summary.total} |`);
        lines.push(`| Successful | ${summary.successful} ✓ |`);
        lines.push(`| Failed | ${summary.failed} ✗ |`);
        lines.push(`| Skipped | ${summary.skipped} ⊘ |`);
        lines.push(
            `| Average Load Time | ${Math.round(summary.averageLoadTime)}ms |`,
        );
        lines.push('');

        lines.push('## Failures by Category');
        lines.push('');
        lines.push('| Category | Count |');
        lines.push('|----------|-------|');
        for (const [category, count] of Object.entries(
            summary.failuresByCategory,
        ) as [FailureCategory, number][]) {
            if (count > 0) {
                lines.push(`| ${category} | ${count} |`);
            }
        }
        lines.push('');

        lines.push('## Slowest Routes');
        lines.push('');
        lines.push('| Route | Duration |');
        lines.push('|-------|----------|');
        for (const { route, duration } of summary.slowestRoutes) {
            lines.push(`| ${route} | ${duration}ms |`);
        }
        lines.push('');

        lines.push('## Route Details');
        lines.push('');
        for (const result of results) {
            const status = result.success ? '✓' : '✗';
            lines.push(`### ${status} ${result.route}`);
            lines.push('');
            lines.push(`**Load Duration:** ${result.loadDuration}ms`);

            if (result.metadata) {
                lines.push(`**Category:** ${result.metadata.category}`);
                lines.push(`**Priority:** ${result.metadata.testPriority}`);
                if (result.metadata.skipReason) {
                    lines.push(
                        `**Skip Reason:** ${result.metadata.skipReason}`,
                    );
                }
            }
            lines.push('');

            if (result.failures.length > 0) {
                lines.push('**Failures:**');
                lines.push('');
                for (const failure of result.failures) {
                    const emoji = this.getFailureEmoji(failure.category);
                    lines.push(
                        `- ${emoji} [${failure.category}] ${failure.message} (${failure.severity})`,
                    );
                }
                lines.push('');
            }

            if (result.telemetry.consoleErrors.length > 0) {
                lines.push('**Console Errors:**');
                lines.push('');
                for (const error of result.telemetry.consoleErrors) {
                    lines.push(`- ${error.message}`);
                }
                lines.push('');
            }

            if (result.telemetry.failedRequests.length > 0) {
                lines.push('**Failed Requests:**');
                lines.push('');
                for (const request of result.telemetry.failedRequests) {
                    lines.push(
                        `- ${request.method} ${request.url} (${request.status})`,
                    );
                }
                lines.push('');
            }

            if (result.telemetry.duplicateRequests.length > 0) {
                lines.push('**Duplicate Requests:**');
                lines.push('');
                for (const dup of result.telemetry.duplicateRequests) {
                    lines.push(
                        `- ${dup.method} ${dup.url} (${dup.count} times)`,
                    );
                }
                lines.push('');
            }

            lines.push('---');
            lines.push('');
        }

        return lines.join('\n');
    }

    /**
     * Get emoji for failure category
     */
    private getFailureEmoji(category: FailureCategory): string {
        const emojis: Record<FailureCategory, string> = {
            infrastructure: '🏗️',
            critical: '🔴',
            degraded: '🟡',
            cosmetic: '🟠',
            performance: '⚡',
            hydration: '💧',
            network: '🌐',
            'missing-data': '📭',
            'placeholder/slop': '🗑️',
        };
        return emojis[category] || '⚠️';
    }
}
