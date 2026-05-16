import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { createAdminClient } from '@/lib/supabase/adminClient';
import type {
    FormFillerProfile,
    FormFillerJob,
} from '@/features/form-filler/types';

type QueryResult<T> = { data: T | null; error: { message: string } | null };

export async function POST(req: Request): Promise<Response> {
    const { supabase } = await createClients();
    const user = await getUserOrThrow(supabase);

    const body = (await req.json()) as { url: string; profileId: string };
    const { url, profileId } = body;
    if (!url || !profileId) {
        return NextResponse.json(
            { error: 'url and profileId are required' },
            { status: 400 },
        );
    }

    // Fetch the profile (RLS ensures it belongs to this user)
    const { data: profile, error: profileErr } = (await supabase
        .from('form_filler_profiles')
        .select('*')
        .eq('id', profileId)
        .eq('user_id', user.id)
        .single()) as unknown as QueryResult<FormFillerProfile>;

    if (profileErr || !profile) {
        return NextResponse.json(
            { error: 'Profile not found' },
            { status: 404 },
        );
    }

    // Create the job with status "pending" and return it immediately
    const admin = createAdminClient();
    const { data: job, error: jobErr } = (await admin
        .from('form_filler_jobs')
        .insert({
            user_id: user.id,
            profile_id: profileId,
            url,
            status: 'pending',
        })
        .select()
        .single()) as unknown as QueryResult<FormFillerJob>;

    if (jobErr || !job) {
        return NextResponse.json(
            { error: 'Could not create job' },
            { status: 500 },
        );
    }

    // Run Playwright in the background — do not await
    void runFill(job.id, url, profile.fields);

    return NextResponse.json({ jobId: job.id }, { status: 202 });
}

const getCachedJobList = unstable_cache(
    async (userId: string) => {
        const admin = createAdminClient();
        return admin
            .from('form_filler_jobs')
            .select('id, url, status, fields_filled, error, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);
    },
    ['form-filler-jobs'],
    { revalidate: 10, tags: ['form-filler-jobs'] },
);

export async function GET(req: Request): Promise<Response> {
    const { supabase } = await createClients();
    const user = await getUserOrThrow(supabase);

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    // Single-job polling must always be fresh — no cache
    if (jobId) {
        const { data, error } = await supabase
            .from('form_filler_jobs')
            .select(
                'id, status, fields_filled, screenshot, error, created_at, url',
            )
            .eq('id', jobId)
            .eq('user_id', user.id)
            .single();
        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }

    const { data, error } = await getCachedJobList(user.id);
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

async function runFill(
    jobId: string,
    url: string,
    fields: Record<string, string>,
): Promise<void> {
    const admin = createAdminClient();

    await admin
        .from('form_filler_jobs')
        .update({ status: 'running', updated_at: new Date().toISOString() })
        .eq('id', jobId);

    try {
        const { fillForm } = await import('@/lib/playwright/formFiller');
        const result = await fillForm(url, fields);

        await admin
            .from('form_filler_jobs')
            .update({
                status: 'done',
                fields_filled: result.fieldsFilled,
                screenshot: result.screenshot,
                updated_at: new Date().toISOString(),
            })
            .eq('id', jobId);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await admin
            .from('form_filler_jobs')
            .update({
                status: 'failed',
                error: message,
                updated_at: new Date().toISOString(),
            })
            .eq('id', jobId);
    }
}
