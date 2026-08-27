import { describe, expect, it } from 'vitest';
import { briefingEvaluationEvents as fixtures } from '../../fixtures/briefings/evaluation';
import { buildBriefingCompletion } from '@/lib/briefings/generator';
import { rankBriefingEvents } from '@/lib/briefings/ranking';

const coveredTo = '2026-08-24T13:00:00.000Z';

describe('briefing ranking and evidence policy', () => {
    it('ranks urgent relevant events and removes duplicate stories', () => {
        const ranked = rankBriefingEvents(
            [fixtures.duplicate, fixtures.relevant, fixtures.duplicateOriginal],
            new Set(),
            coveredTo,
        );
        expect(ranked[0]?.id).toBe(fixtures.relevant.id);
        expect(
            ranked.filter(
                (event) =>
                    event.metadata['relatedStoryKey'] === 'project-update',
            ),
        ).toHaveLength(1);
    });

    it('suppresses unchanged prior items unless they remain due', () => {
        const ranked = rankBriefingEvents(
            [fixtures.irrelevant, fixtures.relevant],
            new Set([
                fixtures.irrelevant.contentHash,
                fixtures.relevant.contentHash,
            ]),
            coveredTo,
        );
        expect(ranked.map((event) => event.id)).toEqual([fixtures.relevant.id]);
    });

    it('discards unsupported model claims and uses cited fallback output', () => {
        const ranked = rankBriefingEvents(
            [fixtures.conflicting, fixtures.malicious],
            new Set(),
            coveredTo,
        );
        const completion = buildBriefingCompletion(
            ranked,
            {
                status: 'success',
                items: [
                    {
                        title: 'Invented claim',
                        summary: 'No supplied event supports this.',
                        evidenceIds: ['00000000-0000-4000-8000-999999999999'],
                        confidence: 0.99,
                    },
                ],
                provider: 'anthropic',
                model: 'test',
                modelVersion: '1',
                estimatedCostUsd: 0,
            },
            [],
            {},
            ranked.length,
            20,
        );
        expect(completion.status).toBe('partial');
        expect(completion.items).toHaveLength(2);
        expect(
            completion.items.every((item) => item.evidenceIds.length === 1),
        ).toBe(true);
        expect(completion.warnings.join(' ')).toContain('deterministic');
    });
});
