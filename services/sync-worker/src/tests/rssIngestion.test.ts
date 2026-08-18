import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalizeArticleUrl, normalizeFeed } from '../rss/feedNormalize.js';
import { parseFeedUrl } from '../rss/feedUrlPolicy.js';
import { WorkerTaskError } from '../v1/processors.js';

const rssFixture = `<?xml version="1.0"?>
<rss version="2.0"><channel><title>Fixture Publisher</title>
<item><guid>story-1</guid><title>Example &amp; Story</title>
<link>https://example.com/story?utm_source=test</link>
<description><![CDATA[<p>Safe <strong>summary</strong>.</p>]]></description>
<author>Reporter</author><pubDate>Mon, 17 Aug 2026 12:00:00 GMT</pubDate></item>
</channel></rss>`;

const atomFixture = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom"><title>Atom Publisher</title>
<entry><id>atom-1</id><title>Atom Story</title>
<link href="https://example.com/atom"/><updated>2026-08-17T13:00:00Z</updated>
<summary>Atom summary</summary></entry></feed>`;

describe('RSS and Atom ingestion', () => {
    it('normalizes minimized RSS provenance and removes tracking parameters', async () => {
        const [item] = await normalizeFeed(
            rssFixture,
            'https://example.com/feed.xml',
            '2026-08-17T14:00:00.000Z',
        );
        assert.equal(item?.sourceEventId, 'story-1');
        assert.equal(item?.canonicalUrl, 'https://example.com/story');
        assert.equal(item?.summary, 'Safe summary.');
        assert.equal(item?.publisher, 'Fixture Publisher');
        assert.equal(item?.relatedStoryKey.length, 64);
    });

    it('supports Atom through the same parser boundary', async () => {
        const [item] = await normalizeFeed(
            atomFixture,
            'https://example.com/atom.xml',
            '2026-08-17T14:00:00.000Z',
        );
        assert.equal(item?.sourceEventId, 'atom-1');
        assert.equal(item?.title, 'Atom Story');
        assert.equal(item?.occurredAt, '2026-08-17T13:00:00.000Z');
    });

    it('rejects malformed XML without leaking source content', async () => {
        await assert.rejects(
            normalizeFeed(
                '<rss><private>secret',
                'https://example.com/feed',
                new Date().toISOString(),
            ),
            (error) =>
                error instanceof WorkerTaskError &&
                error.code === 'rss_malformed_feed' &&
                !error.safeDetail.includes('secret'),
        );
    });

    it('blocks local, metadata, credentialed, and unsupported targets', () => {
        const blocked = [
            'http://127.0.0.1/feed',
            'http://169.254.169.254/latest/meta-data',
            'http://metadata.google.internal/feed',
            'https://user:password@example.com/feed',
            'ftp://example.com/feed',
        ];
        for (const url of blocked) {
            assert.throws(parseFeedUrl.bind(null, url), WorkerTaskError);
        }
    });

    it('canonicalizes URLs conservatively', () => {
        assert.equal(
            canonicalizeArticleUrl(
                'https://example.com/a?id=2&utm_medium=rss#part',
            ),
            'https://example.com/a?id=2',
        );
    });
});
