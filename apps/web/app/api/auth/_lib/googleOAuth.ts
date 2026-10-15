import { z } from 'zod';
import { normalizeGrantedScopes } from '@/lib/auth/oauthConnectionPolicy';

export async function verifyGoogleAccount(
    accessToken: string,
    refreshToken?: string | null,
) {
    const url = new URL('https://oauth2.googleapis.com/tokeninfo');
    url.searchParams.set('access_token', accessToken);
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error('google_identity_verification_failed');
    const info = z
        .object({
            email: z.email(),
            sub: z.string().min(1),
            scope: z.string().min(1),
            expires_in: z.coerce.number().positive(),
            aud: z.string().min(1),
            email_verified: z.union([z.boolean(), z.enum(['true', 'false'])]),
        })
        .parse(await response.json());
    if (info.email_verified !== true && info.email_verified !== 'true')
        throw new Error('google_email_unverified');
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId || info.aud !== clientId)
        throw new Error('google_audience_mismatch');
    return {
        accessToken,
        refreshToken: refreshToken ?? undefined,
        email: info.email.toLowerCase(),
        subject: info.sub,
        scopes: normalizeGrantedScopes(info.scope),
        expiresAt: Date.now() + info.expires_in * 1000,
    };
}
