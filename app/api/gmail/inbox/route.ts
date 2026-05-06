import { google } from 'googleapis';
import type { MethodOptions } from 'googleapis-common';
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

const METHOD_OPTIONS: MethodOptions = {};

function isInvalidGrant(err: unknown): boolean {
    return String(err).includes('invalid_grant');
}

export async function GET(req: Request) {
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);

    try {
        const tokens = await getGoogleTokens(supabaseAdmin, user.id);
        const auth = createGmailClient(tokens);

        // When google-auth-library silently refreshes an expired access token,
        // write the new credentials back so the next request doesn't have to
        // refresh again.
        auth.on('tokens', (newTokens) => {
            if (newTokens.access_token) {
                void supabaseAdmin
                    .from('user_tokens')
                    .update({
                        access_token: newTokens.access_token,
                        expires_at:
                            newTokens.expiry_date ?? Date.now() + 3590 * 1000,
                    })
                    .eq('user_id', user.id);
            }
        });

        await auth.getAccessToken();

        const gmail = google.gmail({ version: 'v1', auth });
        const { searchParams } = new URL(req.url);
        const pageToken = searchParams.get('pageToken') ?? undefined;

        const { ids, nextPageToken } = await fetchEmailBatch(gmail, pageToken);
        if (ids.length === 0) {
            return NextResponse.json({ emails: [], nextPageToken: null });
        }

        const batch = await Promise.all(
            ids.map((id) =>
                gmail.users.messages.get(
                    {
                        userId: 'me',
                        id,
                        format: 'metadata',
                        metadataHeaders: ['Subject', 'From', 'Date'],
                    },
                    METHOD_OPTIONS,
                ),
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
            nextPageToken: nextPageToken ?? null,
        });
    } catch (err) {
        if (isInvalidGrant(err)) {
            // The refresh token has been revoked or expired (e.g. the Google
            // Cloud project is still in Testing mode — tokens expire after 7
            // days for non-verified apps). Clear the stale row so a fresh sign-
            // in will save new tokens via the auth callback.
            void supabaseAdmin
                .from('user_tokens')
                .delete()
                .eq('user_id', user.id);
            return NextResponse.json(
                { error: 'gmail_auth_expired' },
                { status: 401 },
            );
        }

        console.error('Gmail Fetch Error', err);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
