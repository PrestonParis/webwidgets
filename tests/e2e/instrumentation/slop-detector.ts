import { Page } from '@playwright/test';

export interface SlopDetection {
    slopType:
        | 'example.com'
        | 'lorem-ipsum'
        | 'todo-placeholder'
        | 'fake-integration'
        | 'placeholder-url'
        | 'not-implemented'
        | 'dev-fallback'
        | 'empty-card'
        | 'broken-image'
        | 'fake-analytics';
    message: string;
    location?: string;
    severity: 'error' | 'warning' | 'info';
}

export class SlopDetector {
    private slopPatterns: Record<string, RegExp[]> = {
        'example.com': [/example\.com/gi, /www\.example\.com/gi],
        'lorem-ipsum': [/lorem ipsum/gi, /dolor sit amet/gi],
        'todo-placeholder': [
            /TODO:/gi,
            /FIXME:/gi,
            /\[TODO\]/gi,
            /\[FIXME\]/gi,
        ],
        'fake-integration': [
            /fake integration/gi,
            /demo integration/gi,
            /test integration/gi,
        ],
        'placeholder-url': [
            /https?:\/\/placeholder\.com/gi,
            /https?:\/\/example\.com/gi,
        ],
        'not-implemented': [
            /not implemented/gi,
            /coming soon/gi,
            /under construction/gi,
        ],
        'dev-fallback': [/development mode/gi, /dev fallback/gi, /mock data/gi],
        'empty-card': [
            /no data available/gi,
            /nothing to show/gi,
            /no results/gi,
        ],
        'broken-image': [/broken image/gi, /image not found/gi, /alt=""/gi],
        'fake-analytics': [
            /demo analytics/gi,
            /fake metrics/gi,
            /sample data/gi,
        ],
    };

    constructor(private page: Page) {}

    /**
     * Detect slop in the current page
     */
    async detectSlop(): Promise<SlopDetection[]> {
        const detections: SlopDetection[] = [];

        // Get page content
        const pageContent = await this.page.content();

        // Check for slop patterns
        for (const [slopType, patterns] of Object.entries(this.slopPatterns)) {
            for (const pattern of patterns) {
                const matches = pageContent.match(pattern);
                if (matches) {
                    detections.push({
                        slopType: slopType as SlopDetection['slopType'],
                        message: `Found ${slopType}: ${matches[0]}`,
                        severity: this.getSlopSeverity(
                            slopType as SlopDetection['slopType'],
                        ),
                    });
                }
            }
        }

        // Check for broken images
        await this.checkBrokenImages(detections);

        // Check for empty cards without proper empty states
        await this.checkEmptyCards(detections);

        return detections;
    }

    /**
     * Check for broken images
     */
    private async checkBrokenImages(
        detections: SlopDetection[],
    ): Promise<void> {
        const images = await this.page.locator('img').all();

        for (const image of images) {
            const src = await image.getAttribute('src');
            const alt = await image.getAttribute('alt');

            if (!src) continue;

            // Check for placeholder/broken image URLs
            const placeholderPatterns = this.slopPatterns['placeholder-url'];
            if (
                placeholderPatterns &&
                placeholderPatterns.some((p) => p.test(src))
            ) {
                detections.push({
                    slopType: 'placeholder-url',
                    message: `Image with placeholder URL: ${src}`,
                    location: src,
                    severity: 'warning',
                });
            }

            // Check for missing alt text on content images
            if (!alt || alt === '') {
                detections.push({
                    slopType: 'broken-image',
                    message: `Image missing alt text: ${src}`,
                    location: src,
                    severity: 'warning',
                });
            }
        }
    }

    /**
     * Check for empty cards without proper empty states
     */
    private async checkEmptyCards(detections: SlopDetection[]): Promise<void> {
        // Look for cards that might be empty
        const cards = await this.page
            .locator('[data-testid*="card"], .card, .widget')
            .all();

        for (const card of cards) {
            const text = await card.textContent();

            // Check if card is effectively empty
            if (text && text.trim().length < 10) {
                // Check if it has proper empty state indicators
                const hasEmptyState =
                    (await card
                        .locator(
                            '[data-testid="empty"], .empty-state, .no-data',
                        )
                        .count()) > 0;

                if (!hasEmptyState) {
                    detections.push({
                        slopType: 'empty-card',
                        message:
                            'Card appears empty without proper empty state',
                        severity: 'warning',
                    });
                }
            }
        }
    }

    /**
     * Get severity level for slop type
     */
    private getSlopSeverity(
        slopType: SlopDetection['slopType'],
    ): 'error' | 'warning' | 'info' {
        const severityMap: Record<
            SlopDetection['slopType'],
            'error' | 'warning' | 'info'
        > = {
            'example.com': 'error',
            'lorem-ipsum': 'error',
            'todo-placeholder': 'warning',
            'fake-integration': 'error',
            'placeholder-url': 'warning',
            'not-implemented': 'warning',
            'dev-fallback': 'error',
            'empty-card': 'warning',
            'broken-image': 'warning',
            'fake-analytics': 'error',
        };

        return severityMap[slopType];
    }

    /**
     * Generate slop report
     */
    generateSlopReport(detections: SlopDetection[]): string {
        const lines: string[] = [];

        lines.push('# Slop Detection Report');
        lines.push('');
        lines.push(`Total Detections: ${detections.length}`);
        lines.push('');

        // Group by type
        const byType = detections.reduce(
            (acc, d) => {
                const key = d.slopType;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key]!.push(d);
                return acc;
            },
            {} as Record<string, SlopDetection[]>,
        );

        for (const [slopType, items] of Object.entries(byType)) {
            lines.push(`## ${slopType} (${items.length})`);
            lines.push('');
            for (const item of items) {
                lines.push(
                    `- [${item.severity.toUpperCase()}] ${item.message}`,
                );
                if (item.location) {
                    lines.push(`  Location: ${item.location}`);
                }
            }
            lines.push('');
        }

        return lines.join('\n');
    }
}
