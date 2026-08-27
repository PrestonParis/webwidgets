import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { loadBriefingInputs } from './data';
import {
    completeBriefing,
    createBriefingRecord,
    scoresForEvidence,
    type BriefingCompletion,
    type PersistedBriefingItem,
} from './persistence';
import { BRIEFING_RULE_VERSION, rankBriefingEvents } from './ranking';
import type { BriefingSynthesisResult, RankedBriefingEvent } from './types';

export interface GenerateBriefingInput {
    userId: string;
    jobId: string;
    correlationId: string;
    idempotencyKey: string;
    trigger: 'daily' | 'on_demand';
    coveredFrom: string;
    coveredTo: string;
}

export type BriefingSynthesizer = (
    events: RankedBriefingEvent[],
    contextFocus: string,
) => Promise<BriefingSynthesisResult>;

function fallbackItems(events: RankedBriefingEvent[]): PersistedBriefingItem[] {
    return events.slice(0, 8).map((event) => ({
        title: event.title,
        summary:
            event.summary ??
            `This ${event.eventType.replaceAll('.', ' ')} occurred within the covered window.`,
        evidenceIds: [event.id],
        confidence: 0.6,
        section: event.section,
        relevance: event.relevance,
        novelty: event.novelty,
        urgency: event.urgency,
        importance: event.importance,
        fingerprint: event.contentHash,
    }));
}

function validatedModelItems(
    synthesis: BriefingSynthesisResult,
    ranked: RankedBriefingEvent[],
) {
    const rankedById = new Map(ranked.map((event) => [event.id, event]));
    return synthesis.items.flatMap((item) => {
        const evidenceIds = [...new Set(item.evidenceIds)].filter((id) =>
            rankedById.has(id),
        );
        if (
            !evidenceIds.length ||
            evidenceIds.length !== item.evidenceIds.length
        )
            return [];
        return [
            {
                ...item,
                evidenceIds,
                ...scoresForEvidence(evidenceIds, rankedById),
            },
        ];
    });
}

export function buildBriefingCompletion(
    ranked: RankedBriefingEvent[],
    synthesis: BriefingSynthesisResult,
    warnings: string[],
    sourceCoverage: BriefingCompletion['sourceCoverage'],
    inputEventCount: number,
    latencyMs: number,
): BriefingCompletion {
    const modelItems =
        synthesis.status === 'success'
            ? validatedModelItems(synthesis, ranked)
            : [];
    const useFallback = synthesis.status !== 'success' || !modelItems.length;
    const items = useFallback ? fallbackItems(ranked) : modelItems;
    const combinedWarnings = [
        ...warnings,
        ...(synthesis.warning ? [synthesis.warning] : []),
        ...(useFallback && ranked.length
            ? [
                  'External synthesis was unavailable; deterministic ranked events are shown.',
              ]
            : []),
    ];
    return {
        status: !ranked.length
            ? 'empty'
            : combinedWarnings.length || useFallback
              ? 'partial'
              : 'ready',
        items,
        warnings: [...new Set(combinedWarnings)],
        sourceCoverage,
        inputEventCount,
        provider: useFallback ? 'deterministic' : synthesis.provider,
        model: useFallback ? BRIEFING_RULE_VERSION : synthesis.model,
        modelVersion: useFallback ? '1' : synthesis.modelVersion,
        latencyMs,
        estimatedCostUsd: synthesis.estimatedCostUsd,
    };
}

export async function generateBriefing(
    db: SupabaseClient<Database>,
    input: GenerateBriefingInput,
    synthesize: BriefingSynthesizer,
) {
    const startedAt = Date.now();
    const briefingId = await createBriefingRecord(db, {
        ...input,
        ruleVersion: BRIEFING_RULE_VERSION,
    });
    try {
        const loaded = await loadBriefingInputs(
            db,
            input.userId,
            input.coveredFrom,
            input.coveredTo,
        );
        const ranked = rankBriefingEvents(
            loaded.events,
            loaded.seenFingerprints,
            input.coveredTo,
        );
        const synthesis = ranked.length
            ? await synthesize(ranked, loaded.contextFocus)
            : {
                  status: 'abstained' as const,
                  items: [],
                  provider: 'none',
                  model: 'none',
                  modelVersion: 'none',
                  estimatedCostUsd: null,
              };
        const completion = buildBriefingCompletion(
            ranked,
            synthesis,
            loaded.warnings,
            loaded.sourceCoverage,
            loaded.events.length,
            Date.now() - startedAt,
        );
        await completeBriefing(db, input.userId, briefingId, completion);
        return {
            briefingId,
            status: completion.status,
            itemCount: completion.items.length,
        };
    } catch (error) {
        await completeBriefing(db, input.userId, briefingId, {
            status: 'failed',
            items: [],
            warnings: [
                'Briefing generation failed without changing source data.',
            ],
            sourceCoverage: {},
            inputEventCount: 0,
            provider: 'none',
            model: 'none',
            modelVersion: 'none',
            latencyMs: Date.now() - startedAt,
            estimatedCostUsd: null,
            failureCode:
                error instanceof Error
                    ? error.message.slice(0, 120)
                    : 'briefing_failed',
            failureDetail: 'The briefing could not be generated safely.',
        });
        throw error;
    }
}
