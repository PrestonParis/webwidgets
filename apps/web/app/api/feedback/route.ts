import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/adminClient';

interface FeedbackBody {
    feedbackType?: string;
    featureArea?: string;
    satisfactionRating?: number;
    whatIDid?: string;
    whatIWanted?: string;
    whatHappened?: string;
    wantToSee?: string;
    whatConfused?: string;
    bugsFound?: string;
    generalComment?: string;
    howHeard?: string;
}

export async function POST(req: Request): Promise<Response> {
    const body = (await req.json()) as FeedbackBody;

    const supabase = createAdminClient();
    const { error } = await supabase.from('user_feedback').insert({
        feedback_type: body.feedbackType?.trim() || null,
        feature_area: body.featureArea?.trim() || null,
        satisfaction_rating: body.satisfactionRating ?? null,
        what_i_did: body.whatIDid?.trim() || null,
        what_i_wanted: [body.whatIWanted, body.whatHappened]
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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
