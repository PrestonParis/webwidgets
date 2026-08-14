import type { SupabaseClient } from '@supabase/supabase-js';
import { lifecycleTraceQuerySchema } from './actionSchemas';
import { mapActionRequest, mapActionResult } from './executionMappers';
import type { LifecycleTrace } from './executionTypes';
import {
    mapCandidateAction,
    mapInsight,
    mapRawObservation,
    mapTimelineEvent,
} from './mappers';
import type { LifecycleTraceQuery } from './types';

type Row = Record<string, unknown>;

async function getOwnedRow(
    db: SupabaseClient,
    table: string,
    userId: string,
    id: string,
): Promise<Row> {
    const result = await db
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .eq('id', id)
        .single();
    if (result.error) throw result.error;
    return result.data as Row;
}

async function getOptionalOwnedRow(
    db: SupabaseClient,
    table: string,
    userId: string,
    id: string | null,
): Promise<Row | null> {
    if (!id) return null;
    return getOwnedRow(db, table, userId, id);
}

async function loadEvidenceChain(
    db: SupabaseClient,
    userId: string,
    insightRow: Row,
) {
    const evidence = await db
        .from('insight_timeline_events')
        .select('timeline_event_id,position')
        .eq('user_id', userId)
        .eq('insight_id', insightRow.id)
        .order('position', { ascending: true });
    if (evidence.error) throw evidence.error;
    const evidenceIds = ((evidence.data ?? []) as Row[]).map((row) =>
        String(row.timeline_event_id),
    );
    const events = await db
        .from('timeline_events')
        .select('*')
        .eq('user_id', userId)
        .in('id', evidenceIds);
    if (events.error) throw events.error;
    const eventById = new Map(
        ((events.data ?? []) as Row[]).map((row) => [String(row.id), row]),
    );
    const timelineEvents = evidenceIds.map((id) => {
        const row = eventById.get(id);
        if (!row) throw new Error('Lifecycle evidence event is missing');
        return mapTimelineEvent(row);
    });
    const observationIds = [
        ...new Set(timelineEvents.map((event) => event.observationId)),
    ];
    const observationsResult = await db
        .from('raw_observations')
        .select('*')
        .eq('user_id', userId)
        .in('id', observationIds);
    if (observationsResult.error) throw observationsResult.error;
    const observations = ((observationsResult.data ?? []) as Row[]).map(
        mapRawObservation,
    );
    if (observations.length !== observationIds.length) {
        throw new Error('Lifecycle provenance observation is missing');
    }
    return { evidenceIds, observations, timelineEvents };
}

async function listActionResults(
    db: SupabaseClient,
    userId: string,
    actionRequestId: string,
) {
    const result = await db
        .from('action_results')
        .select('*')
        .eq('user_id', userId)
        .eq('action_request_id', actionRequestId)
        .order('attempt', { ascending: true });
    if (result.error) throw result.error;
    return ((result.data ?? []) as Row[]).map(mapActionResult);
}

export async function getLifecycleTrace(
    db: SupabaseClient,
    input: LifecycleTraceQuery,
): Promise<LifecycleTrace> {
    const parsed = lifecycleTraceQuerySchema.parse(input);
    const requestRow = await getOwnedRow(
        db,
        'action_requests',
        parsed.userId,
        parsed.actionRequestId,
    );
    const actionRequest = mapActionRequest(requestRow);
    const candidateRow = await getOwnedRow(
        db,
        'candidate_actions',
        parsed.userId,
        actionRequest.candidateActionId,
    );
    const candidateAction = mapCandidateAction(candidateRow);
    const insightRow = await getOwnedRow(
        db,
        'insights',
        parsed.userId,
        candidateAction.insightId,
    );
    const evidence = await loadEvidenceChain(db, parsed.userId, insightRow);
    const actionResults = await listActionResults(
        db,
        parsed.userId,
        actionRequest.id,
    );
    return {
        observations: evidence.observations,
        timelineEvents: evidence.timelineEvents,
        insight: mapInsight(insightRow, evidence.evidenceIds),
        candidateAction,
        actionRequest,
        actionResults,
        job: await getOptionalOwnedRow(
            db,
            'jobs',
            parsed.userId,
            actionRequest.jobId,
        ),
        automationRun: await getOptionalOwnedRow(
            db,
            'automation_runs',
            parsed.userId,
            actionRequest.automationRunId,
        ),
    };
}
