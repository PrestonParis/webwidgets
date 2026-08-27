import type { CommitmentCandidatesOutput } from '@/features/intelligence/types/externalInference';
import {
    calendarCandidatePayloadSchema,
    taskCandidatePayloadSchema,
} from './schemas';
import type { CommitmentSourceEvent, ProposedCommitment } from './types';

export function validateModelCandidates(
    output: CommitmentCandidatesOutput,
    events: CommitmentSourceEvent[],
    modelVersion: string,
    now: string,
    timeZone: string,
) {
    const eventById = new Map(events.map((event) => [event.id, event]));
    return output.candidates.flatMap((candidate): ProposedCommitment[] => {
        const evidenceIds = [...new Set(candidate.evidenceIds)];
        if (!evidenceIds.length || evidenceIds.some((id) => !eventById.has(id)))
            return [];
        const primaryId = evidenceIds[0];
        if (!primaryId) return [];
        const primary = eventById.get(primaryId);
        const reference = primary?.metadata.contentReference;
        const sourceReference =
            typeof reference === 'string' ? reference.slice(0, 2_000) : null;
        const payload =
            candidate.kind === 'task'
                ? taskCandidatePayloadSchema.safeParse({
                      title: candidate.title,
                      notes: candidate.notes,
                      dueAt: candidate.dueAt,
                      sourceReference,
                  })
                : calendarCandidatePayloadSchema.safeParse({
                      title: candidate.title,
                      notes: candidate.notes,
                      startsAt: candidate.startsAt,
                      endsAt: candidate.endsAt,
                      allDay: false,
                      timeZone,
                      sourceReference,
                  });
        if (!payload.success) return [];
        const time =
            candidate.kind === 'task' ? candidate.dueAt : candidate.startsAt;
        if (!time || Date.parse(time) < Date.parse(now) - 3_600_000) return [];
        return [
            {
                kind: candidate.kind,
                payload: payload.data,
                reason: candidate.reason,
                evidenceIds,
                confidence: candidate.confidence,
                extractorVersion: 'governed-llm-v1',
                modelVersion,
            },
        ];
    });
}
