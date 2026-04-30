import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';
import { fetchEmailBatch } from '@/features/inbox/hooks/useFetchEmails';
import { parseEmails } from '@/features/inbox/lib/parseEmails';
import { normalizeMessage } from '@/features/inbox/lib/normalizeMessage';
import { resolveClassifications } from '@/features/inbox/lib/dbClassifications';
import { buildEmailResponse } from '@/features/inbox/lib/buildResponse';

export async function GET(req: Request) {
    try {
        const { supabase, supabaseAdmin } = await createClients();
        const user = await getUserOrThrow(supabase);
        const tokens = await getGoogleTokens(supabaseAdmin, user.id);

        const auth = createGmailClient(tokens);
        await auth.getAccessToken();

        const gmail = google.gmail({ version: 'v1', auth });
        const { searchParams } = new URL(req.url);
        const pageToken = searchParams.get('pageToken') || undefined;

        const { ids, nextPageToken } = await fetchEmailBatch(gmail, pageToken);
        if (ids.length === 0) {
            return NextResponse.json({ emails: [], nextPageToken: null });
        }

        const batch = await Promise.all(
            ids.map((id) =>
                gmail.users.messages.get({
                    userId: 'me',
                    id,
                    format: 'metadata',
                    metadataHeaders: ['Subject', 'From', 'Date'],
                }),
            ),
        );

        const parsed = parseEmails(batch.map(normalizeMessage), ids);
        const categoryMap = await resolveClassifications(
            supabase,
            user.id,
            parsed,
        );
        const emails = buildEmailResponse(parsed, categoryMap);

        return NextResponse.json({
            emails,
            nextPageToken: nextPageToken || null,
        });
    } catch (err) {
        console.error('Gmail Fetch Error', err);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
