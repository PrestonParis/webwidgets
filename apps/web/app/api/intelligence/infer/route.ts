import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import {
    researchSynthesisInputSchema,
    summarizationInputSchema,
} from '@/features/intelligence/types/externalInference';
import { runInference } from '@/features/intelligence/services/inferenceService';

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

const REQUIRED_CONSENT_SCOPES = [
    'external_llm',
    'external_sensitive_inference',
    'timeline_analysis',
];
const consentRowsSchema = z.array(
    z.object({ scope: z.string(), state: z.string() }),
);
const subscriptionSchema = z
    .object({ plan_id: z.string(), status: z.string() })
    .nullable();

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
    const { supabase, supabaseAdmin } = await createClients();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const authorization = await loadAuthorization(supabase, authData.user.id);
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

async function loadAuthorization(
    supabase: Awaited<ReturnType<typeof createClients>>['supabase'],
    userId: string,
) {
    const [consents, subscription] = await Promise.all([
        supabase
            .from('consent_records')
            .select('scope,state')
            .eq('user_id', userId)
            .in('scope', REQUIRED_CONSENT_SCOPES),
        supabase
            .from('billing_subscriptions')
            .select('plan_id,status')
            .eq('user_id', userId)
            .in('status', ['active', 'trialing'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
    ]);
    const consentRows = consentRowsSchema.safeParse(consents.data ?? []);
    const subscriptionRow = subscriptionSchema.safeParse(subscription.data);
    const grantedConsentScopes = (consentRows.success ? consentRows.data : [])
        .filter((record) => record.state === 'granted')
        .map((record) => record.scope);
    const paidTier = Boolean(
        subscriptionRow.success &&
        subscriptionRow.data &&
        subscriptionRow.data.plan_id !== 'free',
    );
    return { allowExternal: true, paidTier, grantedConsentScopes };
}

async function persistInferenceRecord(
    supabaseAdmin: Awaited<ReturnType<typeof createClients>>['supabaseAdmin'],
    userId: string,
    result: Awaited<ReturnType<typeof runInference>>,
) {
    const metadata = {
        requestId: result.requestId,
        task: result.task,
        status: result.status,
        providerId: 'providerId' in result ? (result.providerId ?? null) : null,
        inputHash: result.audit.redactedInputHash ?? null,
        failureCode: result.audit.failureCode ?? null,
        modelId: 'model' in result ? result.model.modelId : null,
        modelVersion: 'model' in result ? (result.model.version ?? null) : null,
    };
    const writes: PromiseLike<unknown>[] = [
        supabaseAdmin.from('analytics_events').insert({
            user_id: userId,
            type: 'bounded_inference',
            source: 'intelligence',
            metadata,
        }),
    ];
    if ('cost' in result && result.cost) {
        writes.push(
            supabaseAdmin.from('cost_events').insert({
                user_id: userId,
                provider: result.providerId,
                feature: result.task,
                units:
                    (result.cost.inputTokens ?? 0) +
                    (result.cost.outputTokens ?? 0),
                cost_usd: result.cost.estimatedCostUsd,
                metadata: {
                    requestId: result.requestId,
                    modelId: result.model.modelId,
                    modelVersion: result.model.version ?? null,
                    inputTokens: result.cost.inputTokens ?? 0,
                    outputTokens: result.cost.outputTokens ?? 0,
                    pricingConfigured: result.cost.pricingConfigured ?? false,
                },
            }),
        );
    }
    const records = await Promise.all(writes);
    if (records.some(hasPersistenceError)) {
        throw new Error('Inference audit persistence failed');
    }
}

function hasPersistenceError(value: unknown) {
    if (!value || typeof value !== 'object' || !('error' in value))
        return false;
    return Boolean(value.error);
}
