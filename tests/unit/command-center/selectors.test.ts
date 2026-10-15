import { describe, expect, it } from 'vitest';
import {
    candidateOutcomes,
    changesSince,
    impairedSources,
    nextTasks,
    pendingCandidates,
} from '@/features/command-center/lib/commandCenterSelectors';
import type {
    Candidate,
    CommandTask,
    TimelineChange,
} from '@/features/command-center/types/commandCenter';

const candidate = (state: string, verified = false): Candidate => ({
    id: state,
    kind: 'task',
    payload: { title: state },
    payloadHash: 'hash',
    payloadVersion: 1,
    reason: 'Evidence-backed',
    confidence: 0.9,
    state,
    createdAt: '2026-08-30T10:00:00.000Z',
    evidence: [],
    execution: verified
        ? {
              actionRequestId: 'request',
              status: state,
              failureCode: state === 'failed' ? 'provider_failed' : null,
              taskId: 'task',
              verificationStatus: 'verified',
              verifiedAt: '2026-08-30T10:01:00.000Z',
          }
        : null,
});

describe('command center selectors', () => {
    it('shows only changes since the prior visit', () => {
        const items = [
            change('old', '2026-08-29T10:00:00.000Z'),
            change(
                'future-event-already-seen',
                '2026-08-29T11:00:00.000Z',
                '2027-01-06T19:00:00.000Z',
            ),
            change('new', '2026-08-30T10:00:00.000Z'),
        ];
        expect(changesSince(items, '2026-08-30T00:00:00.000Z')).toEqual([
            items[2],
        ]);
    });

    it('keeps unresolved approvals visible across visits', () => {
        expect(
            pendingCandidates([
                candidate('proposed'),
                candidate('edited'),
                candidate('completed', true),
            ]).map((item) => item.state),
        ).toEqual(['proposed', 'edited']);
    });

    it('orders active tasks by due date and excludes completed work', () => {
        const tasks = [
            task('later', '2026-09-02T10:00:00.000Z'),
            task('done', '2026-08-31T10:00:00.000Z', true),
            task('next', '2026-09-01T10:00:00.000Z'),
        ];
        expect(nextTasks(tasks).map((item) => item.id)).toEqual([
            'next',
            'later',
        ]);
    });

    it('surfaces stale and reconnect-required sources without hiding healthy ones', () => {
        const sources = ['healthy', 'stale', 'reconnect_required'].map(
            (health) => ({
                id: health,
                label: health,
                providerId: 'gmail',
                health,
                lastSucceededAt: null,
                issueCode: null,
            }),
        );
        expect(impairedSources(sources).map((item) => item.health)).toEqual([
            'stale',
            'reconnect_required',
        ]);
    });

    it('reports only verified completed or failed candidate outcomes', () => {
        expect(
            candidateOutcomes([
                candidate('completed', true),
                candidate('failed', true),
                candidate('executing'),
            ]).map((item) => item.state),
        ).toEqual(['completed', 'failed']);
    });
});

function change(
    id: string,
    ingestedAt: string,
    occurredAt = ingestedAt,
): TimelineChange {
    return {
        id,
        occurredAt,
        ingestedAt,
        title: id,
        summary: null,
        sourceLabel: 'Gmail',
        sourceType: 'email',
    };
}

function task(id: string, dueAt: string, completed = false): CommandTask {
    return {
        id,
        text: id,
        completed,
        created_at: '2026-08-30T10:00:00.000Z',
        completed_at: completed ? '2026-08-30T11:00:00.000Z' : null,
        due_at: dueAt,
    };
}
