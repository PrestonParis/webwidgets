import { WorkerTaskError } from '../v1/processors.js';
import { fetchGmailSignals } from './gmailProvider.js';
import { fetchGoogleCalendarSignals } from './googleCalendarProvider.js';
import { GoogleHttpError } from './googleHttp.js';
import type { ProviderCursor, ProviderFetchResult } from './providerTypes.js';

export async function fetchGoogleSignals(
    token: string,
    cursor: ProviderCursor,
    scopes: string[],
    limit: number,
): Promise<ProviderFetchResult> {
    try {
        const email = await fetchGmailSignals(token, cursor.email, limit);
        const calendar = scopes.includes('calendar.events')
            ? await fetchGoogleCalendarSignals(token, cursor.calendar, limit)
            : { signals: [] };
        return {
            signals: [...email.signals, ...calendar.signals],
            cursor: {
                ...(email.cursor ? { email: email.cursor } : {}),
                ...(calendar.cursor ? { calendar: calendar.cursor } : {}),
            },
        };
    } catch (error) {
        if (error instanceof WorkerTaskError) throw error;
        if (error instanceof GoogleHttpError && error.status === 401) {
            throw new WorkerTaskError(
                'provider_authorization_failed',
                'Google authorization is expired or revoked.',
                false,
            );
        }
        throw new WorkerTaskError(
            'google_sync_failed',
            'Google source synchronization failed.',
            true,
        );
    }
}
