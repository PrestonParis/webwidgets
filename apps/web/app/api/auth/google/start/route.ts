import { NextResponse } from 'next/server';
import { z } from 'zod';
import { googleReadScopes } from '@/lib/auth/googleConnection';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import {
    beginConnectionAttempt,
    setConnectionCookie,
} from '@/app/api/auth/_lib/connectionAttempt';

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
    const capability = z
        .enum(['gmail', 'calendar', 'drive'])
        .safeParse(searchParams.get('capability') ?? 'calendar');
    if (!capability.success)
        return NextResponse.json(
            { error: 'invalid_capability' },
            { status: 400 },
        );
    const attempt = await beginConnectionAttempt(
        originalUserId,
        'google',
        searchParams.get('redirect'),
    );

    // Use Supabase's signInWithOAuth to generate the OAuth URL.
    // This uses the redirect URI that's already registered in Google Console
    // (Supabase's relay), so no new Console configuration is needed.
    // A one-use server-side attempt binds the callback to the original owner.
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            scopes: googleReadScopes(capability.data),
            queryParams: {
                access_type: 'offline',
                prompt: 'consent select_account',
                include_granted_scopes: 'true',
            },
            redirectTo: `${origin}/auth/callback?ic=1&state=${attempt.state}`,
            skipBrowserRedirect: true,
        },
    });

    if (error ?? !data.url) {
        return NextResponse.json(
            { error: 'Could not initiate Google OAuth' },
            { status: 500 },
        );
    }

    const response = NextResponse.redirect(data.url);
    setConnectionCookie(response, 'google', attempt.state);
    return response;
}
