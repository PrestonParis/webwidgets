export interface ProviderConnection {
    id: string;
    userId: string;
    provider: 'google' | 'microsoft';
    accountEmail: string;
    scopes: string[];
    cursor: string | null;
    disabled: boolean;
}

export interface ProviderAccount {
    id: string;
    userId: string;
    connectionId: string;
    provider: 'google' | 'microsoft';
    email: string;
    accessToken: string;
    refreshToken: string | null;
    expiresAt: number | null;
}

export interface ProviderCursor {
    email?: string;
    calendar?: string;
}

export interface EmailSignal {
    kind: 'email';
    provider: 'gmail' | 'outlook';
    objectId: string;
    providerVersion: string;
    change: 'received' | 'updated' | 'deleted';
    subject: string | null;
    senderEmail: string | null;
    senderName: string | null;
    snippet: string | null;
    occurredAt: string;
    threadId: string | null;
    isRead: boolean | null;
    webLink: string | null;
}

export interface CalendarSignal {
    kind: 'calendar';
    provider: 'google_calendar';
    objectId: string;
    providerVersion: string;
    change: 'upsert' | 'cancelled';
    title: string | null;
    start: string;
    end: string | null;
    allDay: boolean;
    calendarId: string;
    location: string | null;
    webLink: string | null;
}

export type ProviderSignal = EmailSignal | CalendarSignal;

export interface ProviderFetchResult {
    signals: ProviderSignal[];
    cursor: ProviderCursor;
}
