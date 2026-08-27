import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createTypedClients } from '@/lib/supabase/serverClient';
import {
    researchSynthesisInputSchema,
    summarizationInputSchema,
} from '@/features/intelligence/types/externalInference';
import { runInference } from '@/features/intelligence/services/inferenceService';
import { loadExternalInferenceAuthorization } from '@/features/intelligence/services/authorizationServer';
import { persistInferenceRecord } from '@/features/intelligence/services/inferenceAuditServer';

const requestSchema = z.discriminatedUnion('task', [
    z.object({
        task: z.literal('summarization'),
        input: summarizationInputSchema,
    }),
    z.object({
        task: z.literal('research_synthesis'),
        input: researchSynthesisInputSchema,
    }),
]);

export async function POST(request: Request) {
    const parsed = requestSchema.safeParse(
        await request.json().catch(() => null),
    );
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'invalid_request', issues: parsed.error.issues },
            { status: 400 },
        );
    }
    const { supabase, supabaseAdmin } = await createTypedClients();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const authorization = await loadExternalInferenceAuthorization(
        supabase,
        authData.user.id,
    );
    const result = await runInference({
        userId: authData.user.id,
        task: parsed.data.task,
        input: parsed.data.input,
        sensitive: true,
        requiredConsentScopes: ['timeline_analysis'],
        externalAuthorization: authorization,
    });
    await persistInferenceRecord(supabaseAdmin, authData.user.id, result);
    return NextResponse.json(result);
}
