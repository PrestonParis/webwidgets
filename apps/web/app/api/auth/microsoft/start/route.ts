import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';

const MS_AUTH_BASE = 'https://login.microsoftonline.com';
const SCOPES = [
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/User.Read',
    'offline_access',
].join(' ');

function siteUrl(req: Request): string {
    const url = new URL(req.url);
    return process.env.NEXT_PUBLIC_SITE_URL ?? `${url.protocol}//${url.host}`;
}

export async function GET(req: Request) {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const tenantId = process.env.MICROSOFT_TENANT_ID ?? 'common';

    if (!clientId) {
        return NextResponse.json(
            { error: 'Microsoft integration is not configured.' },
            { status: 503 },
        );
    }

    const { supabase } = await createClients();
    try {
        await getUserOrThrow(supabase);
    } catch {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    const { searchParams } = new URL(req.url);
    const redirect = searchParams.get('redirect') ?? '/inbox';
    const safeRedirect = redirect.startsWith('/') ? redirect : '/inbox';

    const callbackUrl = `${siteUrl(req)}/api/auth/microsoft/callback`;

    const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: callbackUrl,
        scope: SCOPES,
        state: encodeURIComponent(safeRedirect),
        prompt: 'select_account',
        response_mode: 'query',
    });

    return NextResponse.redirect(
        `${MS_AUTH_BASE}/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`,
    );
}
