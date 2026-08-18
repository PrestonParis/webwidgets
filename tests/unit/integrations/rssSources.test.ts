import { describe, expect, it } from 'vitest';
import { canonicalizeFeedUrl } from '@/features/integrations/services/rssSourceServer';

describe('RSS source URL validation', () => {
    it('accepts public HTTP sources and removes fragments', () => {
        expect(canonicalizeFeedUrl('https://example.com/feed.xml#latest')).toBe(
            'https://example.com/feed.xml',
        );
    });

    it.each([
        'http://127.0.0.1/feed',
        'http://169.254.169.254/latest/meta-data',
        'http://192.168.1.2/feed',
        'http://service.internal/feed',
        'https://user:secret@example.com/feed',
        'ftp://example.com/feed',
    ])('rejects unsafe source %s', (url) => {
        expect(() => canonicalizeFeedUrl(url)).toThrow('UNSAFE_FEED_URL');
    });
});
