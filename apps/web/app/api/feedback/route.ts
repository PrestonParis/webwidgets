import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/adminClient';

// Anonymous submissions are intentional (public /feedback page), so bound
// every field to keep the service-role insert from being used as free storage.
const shortText = z.string().max(200).optional();
const longText = z.string().max(5000).optional();

const feedbackSchema = z.object({
    feedbackType: shortText,
    featureArea: shortText,
    satisfactionRating: z.number().int().min(1).max(5).optional(),
    whatIDid: longText,
    whatIWanted: longText,
    whatHappened: longText,
    wantToSee: longText,
    whatConfused: longText,
    bugsFound: longText,
    generalComment: longText,
    howHeard: shortText,
});

export async function POST(req: Request): Promise<Response> {
    const parsed = feedbackSchema.safeParse(
        await req.json().catch(() => null),
    );
    if (!parsed.success)
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    const body = parsed.data;

    const supabase = createAdminClient();
    const { error } = await supabase.from('user_feedback').insert({
        feedback_type: body.feedbackType?.trim() || null,
        feature_area: body.featureArea?.trim() || null,
        satisfaction_rating: body.satisfactionRating ?? null,
        what_i_did: body.whatIDid?.trim() || null,
        what_i_wanted:
            [body.whatIWanted, body.whatHappened]
                .filter(Boolean)
                .join('\n\n')
                .trim() || null,
        want_to_see: body.wantToSee?.trim() || null,
        what_confused: body.whatConfused?.trim() || null,
        bugs_found: body.bugsFound?.trim() || null,
        general_comment: body.generalComment?.trim() || null,
        how_heard: body.howHeard?.trim() || null,
    });

    if (error) {
        console.error('[feedback] insert failed', error.code);
        return NextResponse.json(
            { error: 'Could not save feedback' },
            { status: 500 },
        );
    }

    return NextResponse.json({ ok: true });
}
