import { NextResponse } from 'next/server';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { createBriefingRequestSchema } from '@/lib/briefings/schemas';
import { loadBriefingResponse } from '@/lib/briefings/reader';
import { BRIEFING_RULE_VERSION } from '@/lib/briefings/ranking';
import { enqueueBriefingJob } from '@/lib/briefings/workerClient';
import { createTypedClients } from '@/lib/supabase/serverClient';

function windowEnd(now = new Date()) {
    const bucket = Math.floor(now.getTime() / 300_000) * 300_000;
    return new Date(bucket).toISOString();
}

export async function GET() {
    try {
        const { supabase } = await createTypedClients();
        const userId = await getRequestUserId(supabase);
        return NextResponse.json(await loadBriefingResponse(supabase, userId));
    } catch (error) {
        const status =
            error instanceof Error && error.message === 'Unauthorized'
                ? 401
                : 500;
        return NextResponse.json({ error: 'briefing_read_failed' }, { status });
    }
}

export async function POST(request: Request) {
    const parsed = createBriefingRequestSchema.safeParse(
        await request.json().catch(() => ({})),
    );
    if (!parsed.success)
        return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    try {
        const { supabase } = await createTypedClients();
        const userId = await getRequestUserId(supabase);
        const coveredTo = windowEnd();
        const coveredFrom = new Date(
            Date.parse(coveredTo) - parsed.data.windowHours * 3_600_000,
        ).toISOString();
        const idempotencyKey = `briefing:on-demand:${userId}:${coveredTo}`;
        const existing = await supabase
            .from('briefings')
            .select('job_id')
            .eq('user_id', userId)
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle();
        if (existing.data?.job_id)
            return NextResponse.json(
                { jobId: existing.data.job_id },
                { status: 202 },
            );
        const queuedRecord = await supabase
            .from('briefings')
            .insert({
                user_id: userId,
                idempotency_key: idempotencyKey,
                trigger_type: 'on_demand',
                status: 'queued',
                covered_from: coveredFrom,
                covered_to: coveredTo,
                expires_at: new Date(
                    Date.parse(coveredTo) + 48 * 3_600_000,
                ).toISOString(),
                rule_version: BRIEFING_RULE_VERSION,
            })
            .select('id')
            .single();
        if (queuedRecord.error) throw new Error('briefing_create_failed');
        let queued: Awaited<ReturnType<typeof enqueueBriefingJob>>;
        try {
            queued = await enqueueBriefingJob({
                userId,
                trigger: 'on_demand',
                coveredFrom,
                coveredTo,
                idempotencyKey,
            });
        } catch (error) {
            await supabase
                .from('briefings')
                .update({
                    status: 'failed',
                    generated_at: new Date().toISOString(),
                    failure_code: 'briefing_enqueue_failed',
                    failure_detail:
                        'The durable worker could not accept this briefing.',
                })
                .eq('id', queuedRecord.data.id)
                .eq('user_id', userId);
            throw error;
        }
        const linked = await supabase
            .from('briefings')
            .update({ job_id: queued.jobId })
            .eq('id', queuedRecord.data.id)
            .eq('user_id', userId);
        if (linked.error) throw new Error('briefing_job_link_failed');
        return NextResponse.json(queued, { status: 202 });
    } catch (error) {
        const message = error instanceof Error ? error.message : '';
        const status = message === 'Unauthorized' ? 401 : 503;
        return NextResponse.json(
            { error: message || 'briefing_enqueue_failed' },
            { status },
        );
    }
}
