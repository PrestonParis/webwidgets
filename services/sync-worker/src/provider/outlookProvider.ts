import { WorkerTaskError } from '../v1/processors.js';
import { providerHash } from './providerNormalize.js';
import type {
    EmailSignal,
    ProviderCursor,
    ProviderFetchResult,
} from './providerTypes.js';

const GRAPH_API = 'https://graph.microsoft.com/v1.0';

interface GraphMessage {
    id?: string;
    conversationId?: string;
    subject?: string;
    bodyPreview?: string;
    receivedDateTime?: string;
    lastModifiedDateTime?: string;
    isRead?: boolean;
    webLink?: string;
    from?: { emailAddress?: { address?: string; name?: string } };
    '@removed'?: { reason?: string };
}

interface DeltaResponse {
    value?: GraphMessage[];
    '@odata.nextLink'?: string;
    '@odata.deltaLink'?: string;
}

function clean(value: string | undefined, limit: number) {
    const text = value?.replace(/\s+/gu, ' ').trim();
    return text ? text.slice(0, limit) : null;
}

function validDeltaUrl(value: string) {
    try {
        const url = new URL(value);
        return url.origin === 'https://graph.microsoft.com';
    } catch {
        return false;
    }
}

function normalizeMessage(
    message: GraphMessage,
    defaultChange: EmailSignal['change'],
): EmailSignal | null {
    if (!message.id) return null;
    const deleted = Boolean(message['@removed']);
    const occurredAt = message.receivedDateTime
        ? new Date(message.receivedDateTime).toISOString()
        : new Date().toISOString();
    return {
        kind: 'email',
        provider: 'outlook',
        objectId: message.id,
        providerVersion:
            message.lastModifiedDateTime ??
            (deleted
                ? `deleted:${message.id}`
                : providerHash(JSON.stringify(message))),
        change: deleted ? 'deleted' : defaultChange,
        subject: deleted ? null : clean(message.subject, 500),
        senderEmail: deleted
            ? null
            : clean(message.from?.emailAddress?.address, 320),
        senderName: deleted
            ? null
            : clean(message.from?.emailAddress?.name, 300),
        snippet: deleted ? null : clean(message.bodyPreview, 1_000),
        occurredAt,
        threadId: deleted ? null : clean(message.conversationId, 500),
        isRead: deleted ? null : (message.isRead ?? null),
        webLink: deleted ? null : clean(message.webLink, 2_000),
    };
}

export async function fetchOutlookSignals(
    token: string,
    cursor: ProviderCursor,
    limit: number,
): Promise<ProviderFetchResult> {
    const select = [
        'id',
        'conversationId',
        'subject',
        'from',
        'bodyPreview',
        'receivedDateTime',
        'lastModifiedDateTime',
        'isRead',
        'webLink',
    ].join(',');
    let url = cursor.email;
    let defaultChange: EmailSignal['change'] = 'updated';
    if (!url || !validDeltaUrl(url)) {
        defaultChange = 'received';
        const params = new URLSearchParams({
            $select: select,
            $top: String(limit),
        });
        url = `${GRAPH_API}/me/mailFolders/inbox/messages/delta?${params.toString()}`;
    }
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        });
        if (response.status === 401) {
            throw new WorkerTaskError(
                'provider_authorization_failed',
                'Microsoft authorization is expired or revoked.',
                false,
            );
        }
        if (!response.ok) {
            throw new WorkerTaskError(
                'outlook_sync_failed',
                'Microsoft mail synchronization failed.',
                response.status === 429 || response.status >= 500,
            );
        }
        const data = (await response.json()) as DeltaResponse;
        const nextCursor = data['@odata.deltaLink'] ?? data['@odata.nextLink'];
        return {
            signals: (data.value ?? [])
                .map((message) => normalizeMessage(message, defaultChange))
                .filter((item) => item !== null),
            cursor: {
                ...(nextCursor ? { email: nextCursor } : {}),
            },
        };
    } catch (error) {
        if (error instanceof WorkerTaskError) throw error;
        throw new WorkerTaskError(
            'outlook_sync_failed',
            'Microsoft mail synchronization failed.',
            true,
        );
    }
}
