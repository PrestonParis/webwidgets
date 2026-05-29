import { z } from 'zod';
import { ProviderError } from '@/lib/connectors/providerError';

// Microsoft Graph OAuth 2.0 — client credentials + per-user delegated tokens.
// Setup: portal.azure.com → App registrations → register app → add client secret.
// Store per-user access/refresh tokens in user_tokens (has_microsoft column) after
// the /api/auth/microsoft/callback completes the OAuth code exchange.

const GRAPH_API = 'https://graph.microsoft.com/v1.0';
const GRAPH_TOKEN_URL =
    'https://login.microsoftonline.com/common/oauth2/v2.0/token';

function requireMicrosoftClientCredentials(): {
    clientId: string;
    clientSecret: string;
} {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new ProviderError(
            'PROVIDER_NOT_CONFIGURED',
            'Microsoft Graph not configured. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET.',
        );
    }
    return { clientId, clientSecret };
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
    const { clientId, clientSecret } = requireMicrosoftClientCredentials();
    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Calendars.Read https://graph.microsoft.com/Files.Read offline_access',
    });

    const res = await fetch(GRAPH_TOKEN_URL, { method: 'POST', body });
    if (!res.ok)
        throw new ProviderError(
            'PROVIDER_UNAUTHORIZED',
            'Microsoft token refresh failed',
        );
    const data = (await res.json()) as { access_token?: string };
    if (!data.access_token)
        throw new ProviderError(
            'PROVIDER_UNAUTHORIZED',
            'Microsoft token refresh returned no access token',
        );
    return data.access_token;
}

async function graphFetch<T>(
    accessToken: string,
    path: string,
    schema: z.ZodType<T>,
): Promise<T> {
    const res = await fetch(`${GRAPH_API}${path}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
        },
        next: { revalidate: 120 },
    });

    if (res.status === 401)
        throw new ProviderError(
            'PROVIDER_UNAUTHORIZED',
            'Microsoft access token expired or invalid',
        );
    if (res.status === 429)
        throw new ProviderError(
            'PROVIDER_RATE_LIMITED',
            'Microsoft Graph rate limited',
        );
    if (!res.ok)
        throw new ProviderError(
            'PROVIDER_BAD_RESPONSE',
            `Microsoft Graph API ${res.status}`,
        );

    const parsed = schema.safeParse(await res.json());
    if (!parsed.success)
        throw new ProviderError(
            'PROVIDER_BAD_RESPONSE',
            'Microsoft Graph response failed validation',
        );
    return parsed.data;
}

export const outlookMessageSchema = z.object({
    id: z.string(),
    subject: z.string().nullable(),
    from: z
        .object({
            emailAddress: z.object({ name: z.string(), address: z.string() }),
        })
        .nullable(),
    bodyPreview: z.string(),
    receivedDateTime: z.string(),
    isRead: z.boolean(),
    webLink: z.string().optional(),
});

export const outlookCalendarEventSchema = z.object({
    id: z.string(),
    subject: z.string().nullable(),
    start: z.object({ dateTime: z.string(), timeZone: z.string() }),
    end: z.object({ dateTime: z.string(), timeZone: z.string() }),
    isAllDay: z.boolean(),
    location: z.object({ displayName: z.string() }).nullable().optional(),
    webLink: z.string().optional(),
    showAs: z.string().optional(),
});

export type OutlookMessage = z.infer<typeof outlookMessageSchema>;
export type OutlookCalendarEvent = z.infer<typeof outlookCalendarEventSchema>;

export type MicrosoftTokens = {
    accessToken: string;
    refreshToken?: string;
};

async function resolveToken(tokens: MicrosoftTokens): Promise<string> {
    if (tokens.refreshToken) {
        try {
            return await refreshAccessToken(tokens.refreshToken);
        } catch {
            // Fall through to use existing access token
        }
    }
    return tokens.accessToken;
}

export async function fetchOutlookMessages(
    tokens: MicrosoftTokens,
    limit = 10,
): Promise<OutlookMessage[]> {
    const accessToken = await resolveToken(tokens);
    const schema = z.object({ value: z.array(outlookMessageSchema) });
    const { value } = await graphFetch(
        accessToken,
        `/me/mailFolders/inbox/messages?$top=${limit}&$select=id,subject,from,bodyPreview,receivedDateTime,isRead,webLink&$orderby=receivedDateTime desc`,
        schema,
    );
    return value;
}

export async function fetchOutlookCalendarEvents(
    tokens: MicrosoftTokens,
    daysAhead = 7,
): Promise<OutlookCalendarEvent[]> {
    const accessToken = await resolveToken(tokens);
    const startDateTime = new Date().toISOString();
    const endDateTime = new Date(
        Date.now() + daysAhead * 86_400_000,
    ).toISOString();
    const schema = z.object({ value: z.array(outlookCalendarEventSchema) });
    const { value } = await graphFetch(
        accessToken,
        `/me/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$select=id,subject,start,end,isAllDay,location,webLink,showAs&$orderby=start/dateTime`,
        schema,
    );
    return value;
}
