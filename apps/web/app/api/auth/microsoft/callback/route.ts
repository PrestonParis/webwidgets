import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { consumeConnectionAttempt } from '@/app/api/auth/_lib/connectionAttempt';
import { exchangeMicrosoftCode } from '@/app/api/auth/_lib/microsoftOAuth';
import { persistProviderAccount } from '@/app/api/auth/_lib/providerAccount';

export async function GET(req: Request) {
    const url = new URL(req.url);
    try {
        const { supabase } = await createClients();
        const user = await getUserOrThrow(supabase);
        const attempt = await consumeConnectionAttempt(
            user.id,
            'microsoft',
            url.searchParams.get('state'),
        );
        const code = url.searchParams.get('code');
        if (!code || !attempt.verifier || url.searchParams.has('error'))
            throw new Error('oauth_code_missing');
        const account = await exchangeMicrosoftCode(
            req,
            code,
            attempt.verifier,
        );
        await persistProviderAccount(user.id, 'microsoft', account);
        return NextResponse.redirect(new URL(attempt.redirectPath, url.origin));
    } catch {
        return NextResponse.redirect(
            new URL('/auth/auth-code-error', url.origin),
        );
    }
}
