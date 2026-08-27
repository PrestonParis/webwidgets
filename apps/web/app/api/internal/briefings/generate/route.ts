import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { loadExternalInferenceAuthorization } from '@/features/intelligence/services/authorizationServer';
import { persistInferenceRecord } from '@/features/intelligence/services/inferenceAuditServer';
import { runInference } from '@/features/intelligence/services/inferenceService';
import type { ResearchSynthesisOutput } from '@/features/intelligence/types/externalInference';
import {
    generateBriefing,
    type BriefingSynthesizer,
} from '@/lib/briefings/generator';
import { generateBriefingRequestSchema } from '@/lib/briefings/schemas';
import type { RankedBriefingEvent } from '@/lib/briefings/types';
import { createTypedClients } from '@/lib/supabase/serverClient';

function authorized(request: Request) {
    const expected = process.env.WORKER_API_TOKEN;
    const supplied = request.headers
        .get('authorization')
        ?.replace(/^Bearer\s+/i, '');
    if (!expected || !supplied) return false;
    const left = Buffer.from(expected);
    const right = Buffer.from(supplied);
    return left.length === right.length && timingSafeEqual(left, right);
}

function sourceItems(events: RankedBriefingEvent[]) {
    return events.map((event) => ({
        id: event.id,
        title: event.title,
        text: `${event.title}\n${event.summary ?? ''}`.trim(),
        occurredAt: event.occurredAt,
        sourceType: event.sourceType,
    }));
}

function createSynthesizer(
    db: Awaited<ReturnType<typeof createTypedClients>>['supabaseAdmin'],
    userId: string,
): BriefingSynthesizer {
    return async (events, contextFocus) => {
        const authorization = await loadExternalInferenceAuthorization(
            db,
            userId,
        );
        const result = await runInference<
            { items: ReturnType<typeof sourceItems>; objective: string },
            ResearchSynthesisOutput
        >({
            userId,
            task: 'research_synthesis',
            input: {
                items: sourceItems(events),
                objective:
                    `Produce concise briefing items answering what changed, what matters, what is due, and what needs review. Every item must cite supplied event IDs. ${contextFocus}`.slice(
                        0,
                        2_500,
                    ),
            },
            sensitive: true,
            requiredConsentScopes: ['timeline_analysis'],
            externalAuthorization: authorization,
        });
        await persistInferenceRecord(db, userId, result);
        if (result.status !== 'success') {
            return {
                status: result.status,
                items: [],
                provider:
                    'providerId' in result
                        ? (result.providerId ?? 'policy')
                        : 'policy',
                model: 'model' in result ? result.model.modelId : 'none',
                modelVersion:
                    'model' in result
                        ? (result.model.version ?? 'unknown')
                        : 'none',
                estimatedCostUsd:
                    'cost' in result
                        ? (result.cost?.estimatedCostUsd ?? null)
                        : null,
                warning:
                    result.status === 'abstained'
                        ? 'The model abstained because evidence was insufficient or unsafe.'
                        : `External synthesis failed: ${result.code}.`,
            };
        }
        return {
            status: 'success',
            items: result.output.candidates.map((candidate) => ({
                title: candidate.title,
                summary: candidate.rationale,
                evidenceIds: candidate.evidenceIds,
                confidence: candidate.confidence,
            })),
            provider: result.providerId,
            model: result.model.modelId,
            modelVersion: result.model.version ?? 'unknown',
            estimatedCostUsd: result.cost?.estimatedCostUsd ?? null,
        };
    };
}

export async function POST(request: Request) {
    if (!authorized(request))
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const parsed = generateBriefingRequestSchema.safeParse(
        await request.json().catch(() => null),
    );
    if (!parsed.success)
        return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    try {
        const { supabaseAdmin } = await createTypedClients();
        const result = await generateBriefing(
            supabaseAdmin,
            parsed.data,
            createSynthesizer(supabaseAdmin, parsed.data.userId),
        );
        const briefing = await supabaseAdmin
            .from('briefings')
            .select('latency_ms,estimated_cost_usd,status,surfaced_item_count')
            .eq('id', result.briefingId)
            .eq('user_id', parsed.data.userId)
            .single();
        await supabaseAdmin.from('analytics_events').insert({
            user_id: parsed.data.userId,
            type: 'briefing_generated',
            source: 'briefings',
            metadata: {
                briefingId: result.briefingId,
                correlationId: parsed.data.correlationId,
                status: briefing.data?.status ?? result.status,
                latencyMs: briefing.data?.latency_ms ?? null,
                itemCount:
                    briefing.data?.surfaced_item_count ?? result.itemCount,
                estimatedCostUsd: briefing.data?.estimated_cost_usd ?? null,
            },
        });
        return NextResponse.json(result);
    } catch {
        return NextResponse.json(
            { error: 'briefing_generation_failed' },
            { status: 500 },
        );
    }
}
