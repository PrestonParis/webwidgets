import { Readability } from '@mozilla/readability';
import Parser from 'rss-parser';
import { getLogger, traced } from '@/lib/observability/logger';
import { getActionProviderLimiter } from '@/features/actions/lib/rateLimiters';
import {
    extractedContentSchema,
    type ExtractedContent,
} from '@/features/actions/lib/schemas/providerSchemas';

const parser = new Parser();

function htmlToMarkdownish(html: string) {
    return html
        .replace(
            /<h([1-6])[^>]*>(.*?)<\/h\1>/gis,
            (_, level: string, text: string) =>
                `${'#'.repeat(Number(level))} ${text}\n\n`,
        )
        .replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function readableFromHtml(html: string) {
    if (typeof DOMParser === 'undefined') {
        const markdown = htmlToMarkdownish(html);
        return { text: markdown, markdown };
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const parsed = new Readability(doc).parse();
    const text = parsed?.textContent?.trim() ?? htmlToMarkdownish(html);
    return { text, markdown: text };
}

export async function extractRssContent(input: {
    userId: string;
    providerId: string;
    url: string;
}): Promise<ExtractedContent[]> {
    const limiter = getActionProviderLimiter(input.userId, input.providerId);
    const log = getLogger({
        component: 'action-content-provider',
        providerId: input.providerId,
    });

    return traced(
        'actions.provider.rss.extract',
        async () => {
            const feed = await limiter.schedule(() =>
                parser.parseURL(input.url),
            );
            log.info(
                { itemCount: feed.items.length },
                'rss content extracted for action provider',
            );
            return feed.items.slice(0, 20).map((item, index) => {
                const content = readableFromHtml(
                    (item['content:encoded'] as string | undefined) ??
                        item.content ??
                        item.contentSnippet ??
                        '',
                );
                return extractedContentSchema.parse({
                    title: item.title ?? `Untitled item ${index + 1}`,
                    url: item.link,
                    markdown: content.markdown,
                    text: content.text,
                    extractedAt: new Date(),
                    providerId: input.providerId,
                });
            });
        },
        { providerId: input.providerId },
    );
}
