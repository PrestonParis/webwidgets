import { describe, expect, it } from 'vitest';
import {
    actionResultInputSchema,
    approvalDecisionInputSchema,
} from '@/lib/lifecycle/actionSchemas';
import {
    candidateActionInputSchema,
    insightInputSchema,
    rawObservationInputSchema,
    timelineEventInputSchema,
} from '@/lib/lifecycle/coreSchemas';
import {
    buildObservationKey,
    buildTimelineKey,
    canonicalizeJson,
    hashJson,
} from '@/lib/lifecycle/idempotency';

const userId = '11111111-1111-4111-8111-111111111111';
const recordId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const occurredAt = '2026-08-14T12:00:00.000Z';

describe('canonical lifecycle contracts', () => {
    it('canonicalizes and hashes JSON independently of object key order', async () => {
        const left = { nested: { b: 2, a: 1 }, enabled: true };
        const right = { enabled: true, nested: { a: 1, b: 2 } };
        expect(canonicalizeJson(left)).toBe(canonicalizeJson(right));
        await expect(hashJson(left)).resolves.toBe(await hashJson(right));
    });

    it('builds separate stable observation and logical timeline keys', () => {
        const identity = {
            sourceKey: 'rss:feed/1',
            providerObjectId: 'article:42',
            providerVersion: 'v2',
            eventType: 'article.published',
        };
        expect(buildObservationKey(identity)).toContain('v2');
        expect(buildTimelineKey(identity)).not.toContain('v2');
        expect(buildObservationKey(identity)).toBe(
            buildObservationKey(identity),
        );
    });

    it('validates the observation through candidate persistence inputs', () => {
        expect(
            rawObservationInputSchema.parse({
                userId,
                sourceType: 'rss',
                sourceKey: 'rss:feed-1',
                providerObjectId: 'article-42',
                providerVersion: '1',
                eventType: 'article.published',
                payload: { title: 'A useful update' },
                occurredAt,
            }).metadata,
        ).toEqual({});
        expect(
            timelineEventInputSchema.parse({
                userId,
                observationId: recordId,
                idempotencyKey: 'timeline:rss:article-42:published',
                eventType: 'article.published',
                sourceType: 'rss',
                title: 'A useful update',
                occurredAt,
                normalizationVersion: 'rss-normalizer-v1',
            }).title,
        ).toBe('A useful update');
        const insight = insightInputSchema.parse({
            userId,
            evidenceTimelineEventIds: [recordId],
            idempotencyKey: 'insight:article-42:model-v1',
            kind: 'commitment',
            title: 'A deadline changed',
            summary: 'The source moved the deadline.',
            modelProvider: 'openai',
            modelName: 'bounded-analysis',
            modelVersion: 'v1',
            policyVersion: 'candidate-policy-v1',
            confidence: 0.92,
            expiresAt: '2026-08-21T12:00:00.000Z',
        });
        expect(
            candidateActionInputSchema.parse({
                userId,
                insightId: recordId,
                idempotencyKey: 'candidate:article-42:task-v1',
                actionId: 'tasks.create',
                payload: { title: insight.title },
                policyVersion: insight.policyVersion,
                confidence: insight.confidence,
                expiresAt: insight.expiresAt,
            }).payloadVersion,
        ).toBe(1);
    });

    it('requires the exact payload receipt for approval', () => {
        const decision = {
            userId,
            actionRequestId: recordId,
            decision: 'approved' as const,
            permissionSnapshotHash: 'a'.repeat(64),
        };
        expect(() => approvalDecisionInputSchema.parse(decision)).toThrow();
        expect(() =>
            approvalDecisionInputSchema.parse({
                ...decision,
                payload: { title: 'Do the thing' },
                payloadHash: 'b'.repeat(64),
                payloadVersion: 1,
            }),
        ).not.toThrow();
    });

    it('requires a timestamp for a verified provider outcome', () => {
        const result = {
            userId,
            actionRequestId: recordId,
            idempotencyKey: 'result:request-1:attempt-1',
            status: 'succeeded' as const,
            message: 'Provider accepted the change',
            verificationStatus: 'verified' as const,
        };
        expect(() => actionResultInputSchema.parse(result)).toThrow();
        expect(() =>
            actionResultInputSchema.parse({
                ...result,
                verifiedAt: occurredAt,
            }),
        ).not.toThrow();
    });
});
