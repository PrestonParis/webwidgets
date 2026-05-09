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
import { getLogger, runWithContext } from '@/lib/observability/logger';
import { captureError } from '@/lib/observability/sentry';
import {
    externalApiDuration,
    externalApiErrors,
} from '@/lib/observability/metrics';

const METHOD_OPTIONS: MethodOptions = {};

function isInvalidGrant(err: unknown): boolean {
    return String(err).includes('invalid_grant');
}

export async function GET(req: Request) {
    const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);

    return runWithContext(
        { requestId, userId: user.id, operation: 'GET /api/gmail/inbox' },
        async () => {
            const log = getLogger();
            const start = performance.now();
            log.info('Gmail inbox fetch started');

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
                                    newTokens.expiry_date ??
                                    Date.now() + 3590 * 1000,
                            })
                            .eq('user_id', user.id);
                    }
                });

                await auth.getAccessToken();

                const gmail = google.gmail({ version: 'v1', auth });
                const { searchParams } = new URL(req.url);
                const pageToken = searchParams.get('pageToken') ?? undefined;

                const gmailEnd = externalApiDuration.startTimer({
                    service: 'gmail',
                    operation: 'fetch_inbox',
                });
                const { ids, nextPageToken } = await fetchEmailBatch(
                    gmail,
                    pageToken,
                );
                if (ids.length === 0) {
                    gmailEnd({ status: '200' });
                    log.info(
                        { durationMs: Math.round(performance.now() - start) },
                        'Inbox empty',
                    );
                    return NextResponse.json({
                        emails: [],
                        nextPageToken: null,
                    });
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
                gmailEnd({ status: '200' });

                const { data: rawProfile } = await supabaseAdmin
                    .from('profiles')
                    .select('use_ai_email, anthropic_api_key')
                    .eq('id', user.id)
                    .maybeSingle();

                const profile = rawProfile as {
                    use_ai_email: boolean;
                    anthropic_api_key: string | null;
                } | null;

                const classifyOptions = {
                    useAI: profile?.use_ai_email ?? false,
                    ...(profile?.anthropic_api_key
                        ? { apiKey: profile.anthropic_api_key }
                        : {}),
                };

                const parsed = parseEmails(batch.map(normalizeMessage), ids);
                const categoryMap = await resolveClassifications(
                    supabase,
                    user.id,
                    parsed,
                    classifyOptions,
                );
                const emails = buildEmailResponse(parsed, categoryMap);

                log.info(
                    {
                        emailCount: emails.length,
                        durationMs: Math.round(performance.now() - start),
                    },
                    'Inbox fetched',
                );
                return NextResponse.json({
                    emails,
                    nextPageToken: nextPageToken ?? null,
                });
            } catch (err) {
                if (isInvalidGrant(err)) {
                    externalApiErrors.inc({
                        service: 'gmail',
                        operation: 'fetch_inbox',
                    });
                    log.warn(
                        'Gmail token expired — clearing stored credentials',
                    );
                    void supabaseAdmin
                        .from('user_tokens')
                        .delete()
                        .eq('user_id', user.id);
                    return NextResponse.json(
                        { error: 'gmail_auth_expired' },
                        { status: 401 },
                    );
                }

                captureError(err, {
                    userId: user.id,
                    operation: 'GET /api/gmail/inbox',
                    feature: 'inbox',
                });
                log.error(
                    { err, durationMs: Math.round(performance.now() - start) },
                    'Gmail inbox fetch failed',
                );
                return NextResponse.json(
                    { error: 'Failed to fetch' },
                    { status: 500 },
                );
            }
        },
    ); // end runWithContext
}
