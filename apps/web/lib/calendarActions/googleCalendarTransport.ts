export class GoogleCalendarActionError extends Error {
    constructor(readonly status: number | null) {
        super('google_calendar_request_failed');
    }
}
export function googleCalendarTransport(accessToken: string) {
    return async (
        path: string,
        options: { method?: 'GET' | 'PUT' | 'DELETE'; body?: unknown } = {},
    ): Promise<unknown> => {
        let response: Response;
        try {
            response = await fetch(
                `https://www.googleapis.com/calendar/v3/${path}`,
                {
                    method: options.method ?? 'GET',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    ...(options.body === undefined
                        ? {}
                        : { body: JSON.stringify(options.body) }),
                    signal: AbortSignal.timeout(12_000),
                    redirect: 'error',
                    cache: 'no-store',
                },
            );
        } catch {
            throw new GoogleCalendarActionError(null);
        }
        if (!response.ok) throw new GoogleCalendarActionError(response.status);
        if (response.status === 204) return null;
        try {
            return (await response.json()) as unknown;
        } catch {
            throw new GoogleCalendarActionError(null);
        }
    };
}
export type GoogleCalendarTransport = ReturnType<
    typeof googleCalendarTransport
>;
