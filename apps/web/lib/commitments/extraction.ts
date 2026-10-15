import { normalizeDatedText, isFuture } from './dateNormalization';
import type { CommitmentSourceEvent, ProposedCommitment } from './types';

export const COMMITMENT_EXTRACTOR_VERSION = 'commitment-rules-v1';
const commitmentPattern =
    /\b(due|deadline|please (?:send|submit|complete|review)|can you|need you to|must|by tomorrow)\b/i;

function sourceReference(event: CommitmentSourceEvent) {
    const value = event.metadata.contentReference;
    return typeof value === 'string' ? value.slice(0, 2_000) : null;
}

export function extractDeterministicCommitments(
    events: CommitmentSourceEvent[],
    now: string,
): ProposedCommitment[] {
    return events.flatMap((event) => {
        if (!event.eventType.startsWith('email.')) return [];
        const text = `${event.title}\n${event.summary ?? ''}`.slice(0, 4_000);
        if (!commitmentPattern.test(text)) return [];
        const dueAt = normalizeDatedText(text, event.occurredAt);
        if (!dueAt || !isFuture(dueAt, now)) return [];
        return [
            {
                kind: 'task' as const,
                payload: {
                    title: event.title.slice(0, 300),
                    notes: (event.summary ?? '').slice(0, 1_000),
                    dueAt,
                    sourceReference: sourceReference(event),
                },
                reason: 'The message contains a dated request or deadline.',
                evidenceIds: [event.id],
                confidence: 0.86,
                extractorVersion: COMMITMENT_EXTRACTOR_VERSION,
                modelVersion: null,
            },
        ];
    });
}

export function candidateFingerprint(candidate: ProposedCommitment) {
    const payload = candidate.payload as Record<string, unknown>;
    const rawTitle = typeof payload.title === 'string' ? payload.title : '';
    const rawTime =
        typeof payload.dueAt === 'string'
            ? payload.dueAt
            : typeof payload.startsAt === 'string'
              ? payload.startsAt
              : '';
    const title = rawTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
    const time = rawTime.slice(0, 10);
    return `${candidate.kind}:${title}:${time}`.slice(0, 600);
}

export function deduplicateCommitments(candidates: ProposedCommitment[]) {
    const best = new Map<string, ProposedCommitment>();
    for (const candidate of candidates) {
        const key = candidateFingerprint(candidate);
        const existing = best.get(key);
        if (!existing || existing.confidence < candidate.confidence)
            best.set(key, candidate);
    }
    return [...best.values()];
}
