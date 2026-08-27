import { NextResponse } from 'next/server';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { loadExternalInferenceAuthorization } from '@/features/intelligence/services/authorizationServer';
import { persistInferenceRecord } from '@/features/intelligence/services/inferenceAuditServer';
import { runInference } from '@/features/intelligence/services/inferenceService';
import type { CommitmentCandidatesOutput } from '@/features/intelligence/types/externalInference';
import { generateCommitmentCandidates } from '@/lib/commitments/generator';
import { validateModelCandidates } from '@/lib/commitments/modelCandidates';
import { loadCommitmentCandidates } from '@/lib/commitments/reader';
import { generateCandidatesSchema } from '@/lib/commitments/schemas';
import type { CommitmentSourceEvent } from '@/lib/commitments/types';
import { createTypedClients } from '@/lib/supabase/serverClient';

function modelItems(events: CommitmentSourceEvent[]) {
    return events.map((event) => ({
        id: event.id,
        title: event.title,
        text: `${event.title}\n${event.summary ?? ''}`.trim().slice(0, 4_000),
        occurredAt: event.occurredAt,
        sourceType: event.sourceType,
    }));
}

export async function GET() {
    try {
        const { supabase } = await createTypedClients();
        const userId = await getRequestUserId(supabase);
        return NextResponse.json({
            candidates: await loadCommitmentCandidates(supabase, userId),
        });
    } catch (error) {
        const status =
            error instanceof Error && error.message === 'Unauthorized'
                ? 401
                : 500;
        return NextResponse.json(
            { error: 'candidate_read_failed' },
            { status },
        );
    }
}

export async function POST(request: Request) {
    const parsed = generateCandidatesSchema.safeParse(
        await request.json().catch(() => ({})),
    );
    if (!parsed.success)
        return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    try {
        const { supabase, supabaseAdmin } = await createTypedClients();
        const userId = await getRequestUserId(supabase);
        const authorization = await loadExternalInferenceAuthorization(
            supabaseAdmin,
            userId,
        );
        const result = await generateCommitmentCandidates(
            supabaseAdmin,
            userId,
            parsed.data.lookbackDays,
            async (events, timeZone) => {
                const inference = await runInference<
                    { items: ReturnType<typeof modelItems>; objective: string },
                    CommitmentCandidatesOutput
                >({
                    userId,
                    task: 'commitment_candidates',
                    input: {
                        items: modelItems(events),
                        objective:
                            'Extract only credible user commitments or requests with explicit dates. Produce editable task or calendar candidates, never approvals or executions.',
                    },
                    sensitive: true,
                    requiredConsentScopes: [
                        'timeline_analysis',
                        'email_access',
                    ],
                    externalAuthorization: authorization,
                });
                await persistInferenceRecord(supabaseAdmin, userId, inference);
                return inference.status === 'success'
                    ? validateModelCandidates(
                          inference.output,
                          events,
                          inference.model.version ?? inference.model.modelId,
                          new Date().toISOString(),
                          timeZone,
                      )
                    : [];
            },
        );
        await supabaseAdmin.from('analytics_events').insert({
            user_id: userId,
            type: 'commitment_candidates_generated',
            source: 'commitment_candidates',
            metadata: result,
        });
        return NextResponse.json(result);
    } catch (error) {
        const status =
            error instanceof Error && error.message === 'Unauthorized'
                ? 401
                : 500;
        return NextResponse.json(
            { error: 'candidate_generation_failed' },
            { status },
        );
    }
}
