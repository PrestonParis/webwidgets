import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getLogger } from '@/lib/observability/logger';

const MS_TOKEN_URL = 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token';
const GRAPH_MESSAGES_URL =
    'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages' +
    '?$select=id,subject,from,receivedDateTime,bodyPreview' +
    '&$top=20&$orderby=receivedDateTime+desc';

interface GraphMessage {
    id: string;
    subject: string;
    from: { emailAddress: { address: string; name: string } };
    receivedDateTime: string;
    bodyPreview: string;
}

interface GraphResponse {
    value: GraphMessage[];
    '@odata.nextLink'?: string;
    error?: { code: string; message: string };
}

interface StoredTokens {
    microsoft_access_token: string | null;
    microsoft_refresh_token: string | null;
    expires_at: number | null;
}

async function refreshMicrosoftToken(
    refreshToken: string,
): Promise<{ access_token: string; expires_in: number } | null> {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_TENANT_ID ?? 'common';
    if (!clientId || !clientSecret) return null;

    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Mail.Read offline_access',
    });

    try {
        const res = await fetch(
            MS_TOKEN_URL.replace('{tenant}', tenantId),
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
            },
        );
        const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
        if (json.error || !json.access_token) return null;
        return { access_token: json.access_token, expires_in: json.expires_in ?? 3600 };
    } catch {
        return null;
    }
}

function normalizeMessage(msg: GraphMessage) {
    return {
        id: `outlook:${msg.id}`,
        subject: msg.subject ?? '(no subject)',
        sender: msg.from?.emailAddress?.name ?? msg.from?.emailAddress?.address ?? '',
        snippet: msg.bodyPreview ?? '',
        date: msg.receivedDateTime,
    };
}

export async function GET(_req: Request) {
    const log = getLogger({ operation: 'GET /api/outlook/inbox' });
    const { supabase, supabaseAdmin } = await createClients();

    let userId: string;
    try {
        const user = await getUserOrThrow(supabase);
        userId = user.id;
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tokenRow } = await supabaseAdmin
        .from('user_tokens')
        .select('microsoft_access_token, microsoft_refresh_token, expires_at')
        .eq('user_id', userId)
        .maybeSingle();

    const tokens = tokenRow as StoredTokens | null;

    if (!tokens?.microsoft_access_token) {
        return NextResponse.json({ error: 'outlook_not_connected' }, { status: 401 });
    }

    let accessToken = tokens.microsoft_access_token;

    // Refresh if within 5 minutes of expiry
    if (
        tokens.microsoft_refresh_token &&
        tokens.expires_at &&
        Date.now() > tokens.expires_at - 5 * 60 * 1000
    ) {
        const refreshed = await refreshMicrosoftToken(tokens.microsoft_refresh_token);
        if (refreshed) {
            accessToken = refreshed.access_token;
            await supabaseAdmin
                .from('user_tokens')
                .update({
                    microsoft_access_token: refreshed.access_token,
                    expires_at: Date.now() + refreshed.expires_in * 1000,
                })
                .eq('user_id', userId);
        }
    }

    try {
        const res = await fetch(GRAPH_MESSAGES_URL, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.status === 401) {
            // Token invalid — clear it
            await supabaseAdmin
                .from('user_tokens')
                .update({ microsoft_access_token: null, has_microsoft: false })
                .eq('user_id', userId);
            return NextResponse.json({ error: 'outlook_auth_expired' }, { status: 401 });
        }

        if (!res.ok) {
            log.error({ status: res.status }, 'Graph API error');
            return NextResponse.json({ error: 'Graph API error' }, { status: 502 });
        }

        const json = (await res.json()) as GraphResponse;
        if (json.error) {
            log.error({ code: json.error.code }, 'Graph response error');
            return NextResponse.json({ error: json.error.message }, { status: 502 });
        }

        const emails = (json.value ?? []).map(normalizeMessage);
        log.info({ count: emails.length }, 'Outlook inbox fetched');
        return NextResponse.json({ emails, nextPageToken: null });
    } catch (err) {
        log.error({ err }, 'Outlook inbox fetch failed');
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
