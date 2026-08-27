import { describe, expect, it } from 'vitest';
import { commitmentFixtures as fixtures } from '../../fixtures/commitments/evaluation';
import { hasCommitmentConsent } from '@/lib/commitments/data';
import {
    deduplicateCommitments,
    extractDeterministicCommitments,
} from '@/lib/commitments/extraction';
import { validateModelCandidates } from '@/lib/commitments/modelCandidates';

const now = '2026-08-27T14:00:00.000Z';

describe('commitment candidate policy', () => {
    it('extracts credible dated requests and rejects irrelevant, ambiguous, and stale mail', () => {
        const result = extractDeterministicCommitments(
            [
                fixtures.positive,
                fixtures.negative,
                fixtures.ambiguous,
                fixtures.stale,
            ],
            now,
        );
        expect(result).toHaveLength(1);
        expect(result[0]?.evidenceIds).toEqual([fixtures.positive.id]);
        expect(result[0]?.payload).toMatchObject({
            dueAt: '2026-08-29T17:00:00.000Z',
        });
    });

    it('deduplicates repeated threads by normalized payload and date', () => {
        const extracted = extractDeterministicCommitments(
            [fixtures.positive, fixtures.duplicate],
            now,
        );
        expect(deduplicateCommitments(extracted)).toHaveLength(1);
    });

    it('normalizes relative dates without treating source text as approval', () => {
        const [relative] = extractDeterministicCommitments(
            [fixtures.timezone],
            now,
        );
        const [hostile] = extractDeterministicCommitments(
            [fixtures.malicious],
            now,
        );
        expect(relative?.payload).toMatchObject({
            dueAt: '2026-08-28T17:00:00.000Z',
        });
        expect(hostile).toBeUndefined();
    });

    it('rejects unsupported model evidence and preserves the user timezone', () => {
        const rejected = validateModelCandidates(
            {
                candidates: [
                    {
                        kind: 'calendar',
                        title: 'Review',
                        notes: '',
                        startsAt: '2026-08-30T14:00:00.000Z',
                        endsAt: '2026-08-30T15:00:00.000Z',
                        dueAt: null,
                        reason: 'Requested review',
                        evidenceIds: ['unsupported'],
                        confidence: 0.8,
                    },
                ],
            },
            [fixtures.positive],
            'model-v1',
            now,
            'America/New_York',
        );
        expect(rejected).toEqual([]);
        const accepted = validateModelCandidates(
            {
                candidates: [
                    {
                        kind: 'calendar',
                        title: 'Review',
                        notes: '',
                        startsAt: '2026-08-30T14:00:00.000Z',
                        endsAt: '2026-08-30T15:00:00.000Z',
                        dueAt: null,
                        reason: 'Requested review',
                        evidenceIds: [fixtures.positive.id],
                        confidence: 0.8,
                    },
                ],
            },
            [fixtures.positive],
            'model-v1',
            now,
            'America/New_York',
        );
        expect(accepted[0]?.payload).toMatchObject({
            timeZone: 'America/New_York',
        });
    });

    it('requires current timeline and email consent', () => {
        expect(
            hasCommitmentConsent([
                { scope: 'timeline_analysis', state: 'granted' },
                { scope: 'email_access', state: 'revoked' },
            ]),
        ).toBe(false);
    });
});
