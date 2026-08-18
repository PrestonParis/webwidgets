import { WorkerTaskError } from '../v1/processors.js';
import { assertPublicFeedUrl } from './feedUrlPolicy.js';

const maxRedirects = 5;
const maxBytes = 2_000_000;

export interface FeedRequestState {
    etag?: string | null;
    lastModified?: string | null;
}

export interface FeedResponse {
    body?: string;
    finalUrl: string;
    notModified: boolean;
    etag: string | null;
    lastModified: string | null;
}

export async function fetchFeed(
    sourceUrl: string,
    state: FeedRequestState = {},
): Promise<FeedResponse> {
    let current = await assertPublicFeedUrl(sourceUrl);
    for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
        const response = await fetch(current, {
            redirect: 'manual',
            signal: AbortSignal.timeout(20_000),
            headers: {
                Accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml',
                'User-Agent': 'WebWidgets-RSS/1.0',
                ...(state.etag && { 'If-None-Match': state.etag }),
                ...(state.lastModified && {
                    'If-Modified-Since': state.lastModified,
                }),
            },
        });
        if (response.status === 304) {
            return {
                finalUrl: current.toString(),
                notModified: true,
                etag: response.headers.get('etag') ?? state.etag ?? null,
                lastModified:
                    response.headers.get('last-modified') ??
                    state.lastModified ??
                    null,
            };
        }
        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');
            if (!location || redirects === maxRedirects) {
                throw new WorkerTaskError(
                    'rss_redirect_failed',
                    'The feed redirect chain is invalid or too long.',
                    false,
                );
            }
            current = await assertPublicFeedUrl(
                new URL(location, current).toString(),
            );
            continue;
        }
        if (!response.ok) {
            throw new WorkerTaskError(
                'rss_fetch_failed',
                `The feed returned HTTP ${response.status}.`,
                response.status === 408 ||
                    response.status === 429 ||
                    response.status >= 500,
            );
        }
        const declaredSize = Number(response.headers.get('content-length'));
        if (declaredSize > maxBytes) {
            throw new WorkerTaskError(
                'rss_feed_too_large',
                'The feed exceeds the maximum supported size.',
                false,
            );
        }
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength > maxBytes) {
            throw new WorkerTaskError(
                'rss_feed_too_large',
                'The feed exceeds the maximum supported size.',
                false,
            );
        }
        return {
            body: new TextDecoder().decode(bytes),
            finalUrl: current.toString(),
            notModified: false,
            etag: response.headers.get('etag'),
            lastModified: response.headers.get('last-modified'),
        };
    }
    throw new WorkerTaskError(
        'rss_redirect_failed',
        'The feed redirect chain is invalid or too long.',
        false,
    );
}
