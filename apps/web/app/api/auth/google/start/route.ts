import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';

const GOOGLE_WORKSPACE_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
];

export async function GET(req: Request) {
    const { supabase } = await createClients();

    // Only available to already-authenticated users.
    let originalUserId: string;
    try {
        const user = await getUserOrThrow(supabase);
        originalUserId = user.id;
    } catch {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    const { searchParams, origin } = new URL(req.url);
    const redirect = searchParams.get('redirect') ?? '/inbox';
    const safeRedirect = redirect.startsWith('/') ? redirect : '/inbox';
    const service = searchParams.get('service');
    const isDriveConnect = service === 'drive';
    const scopes = isDriveConnect
        ? [
              ...GOOGLE_WORKSPACE_SCOPES,
              'https://www.googleapis.com/auth/drive.readonly',
          ]
        : GOOGLE_WORKSPACE_SCOPES;

    // Use Supabase's signInWithOAuth to generate the OAuth URL.
    // This uses the redirect URI that's already registered in Google Console
    // (Supabase's relay), so no new Console configuration is needed.
    // We embed ic=1 (inbox-connect flag) and the original user ID in redirectTo
    // so the callback can store tokens without replacing the active session.
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            scopes: scopes.join(' '),
            queryParams: {
                access_type: 'offline',
                prompt: 'consent select_account',
                include_granted_scopes: 'true',
            },
            redirectTo: `${origin}/auth/callback?ic=1&uid=${originalUserId}&next=${encodeURIComponent(safeRedirect)}${isDriveConnect ? '&service=drive' : ''}`,
            skipBrowserRedirect: true,
        },
    });

    if (error ?? !data.url) {
        return NextResponse.json(
            { error: 'Could not initiate Google OAuth' },
            { status: 500 },
        );
    }

    return NextResponse.redirect(data.url);
}
