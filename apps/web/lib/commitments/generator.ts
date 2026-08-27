import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import {
    candidateFingerprint,
    deduplicateCommitments,
    extractDeterministicCommitments,
} from './extraction';
import {
    loadCommitmentEvents,
    loadCommitmentTimezone,
    loadEmailActionHints,
    loadExistingCalendarKeys,
    loadExistingTaskKeys,
} from './data';
import { persistCommitmentCandidate } from './persistence';
import type { CommitmentSourceEvent, ProposedCommitment } from './types';

export type AmbiguousCommitmentResolver = (
    events: CommitmentSourceEvent[],
    timeZone: string,
) => Promise<ProposedCommitment[]>;

export async function generateCommitmentCandidates(
    db: SupabaseClient<Database>,
    userId: string,
    lookbackDays: number,
    resolveAmbiguous: AmbiguousCommitmentResolver,
) {
    const now = new Date().toISOString();
    const from = new Date(
        Date.parse(now) - lookbackDays * 86_400_000,
    ).toISOString();
    const events = await loadCommitmentEvents(db, userId, from);
    const deterministic = extractDeterministicCommitments(events, now);
    const internalHints = await loadEmailActionHints(db, userId, events, now);
    const covered = new Set(
        [...deterministic, ...internalHints].flatMap(
            (item) => item.evidenceIds,
        ),
    );
    const ambiguous = events
        .filter((event) => !covered.has(event.id))
        .slice(0, 20);
    const [timeZone, existingTasks, existingEvents] = await Promise.all([
        loadCommitmentTimezone(db, userId),
        loadExistingTaskKeys(db, userId),
        loadExistingCalendarKeys(db, userId),
    ]);
    const model = ambiguous.length
        ? await resolveAmbiguous(ambiguous, timeZone)
        : [];
    const candidates = deduplicateCommitments([
        ...deterministic,
        ...internalHints,
        ...model,
    ]).filter((candidate) => {
        const key = candidateFingerprint(candidate);
        return !existingTasks.has(key) && !existingEvents.has(key);
    });
    const ids: string[] = [];
    for (const candidate of candidates.slice(0, 12)) {
        ids.push(await persistCommitmentCandidate(db, userId, candidate));
    }
    return {
        scannedEventCount: events.length,
        candidateCount: new Set(ids).size,
        usedExternalResolution: model.length > 0,
    };
}
