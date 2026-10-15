import { providerHash } from './providerNormalize.js';
import { cleanGoogleValue, GoogleHttpError, googleJson } from './googleHttp.js';
import type { EmailSignal } from './providerTypes.js';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

interface GmailMessage {
    id?: string;
    threadId?: string;
    historyId?: string;
    internalDate?: string;
    labelIds?: string[];
    snippet?: string;
    payload?: { headers?: { name?: string; value?: string }[] };
}

interface GmailHistory {
    historyId?: string;
    nextPageToken?: string;
    history?: Array<{
        messagesAdded?: Array<{ message?: GmailMessage }>;
        messagesDeleted?: Array<{ message?: GmailMessage }>;
        labelsAdded?: Array<{ message?: GmailMessage }>;
        labelsRemoved?: Array<{ message?: GmailMessage }>;
    }>;
}

async function fetchHistoryPages(
    token: string,
    params: URLSearchParams,
    cursor: string,
) {
    const ids = new Map<string, EmailSignal['change']>();
    let pageToken: string | undefined;
    let nextCursor = cursor;
    do {
        if (pageToken) params.set('pageToken', pageToken);
        else params.delete('pageToken');
        const page = await googleJson<GmailHistory>(
            `${GMAIL_API}/history?${params.toString()}`,
            token,
        );
        for (const [id, change] of historyChanges(page)) ids.set(id, change);
        nextCursor = page.historyId ?? nextCursor;
        pageToken = page.nextPageToken;
    } while (pageToken);
    return { ids, cursor: nextCursor };
}

function messageHeader(message: GmailMessage, name: string) {
    return message.payload?.headers?.find(
        (header) => header.name?.toLowerCase() === name.toLowerCase(),
    )?.value;
}

function parseSender(value: string | undefined) {
    const raw = value?.trim() ?? '';
    const match = raw.match(/^(.*?)\s*<([^>]+)>$/u);
    return {
        email: cleanGoogleValue(match?.[2] ?? raw, 320),
        name: cleanGoogleValue(match?.[1]?.replace(/^"|"$/gu, ''), 300),
    };
}

function normalizeMessage(
    message: GmailMessage,
    change: EmailSignal['change'],
): EmailSignal | null {
    if (!message.id) return null;
    const occurredAt = new Date(
        Number(message.internalDate ?? Date.now()),
    ).toISOString();
    const sender = parseSender(messageHeader(message, 'From'));
    const subject = cleanGoogleValue(messageHeader(message, 'Subject'), 500);
    return {
        kind: 'email',
        provider: 'gmail',
        objectId: message.id,
        providerVersion:
            message.historyId ??
            providerHash(
                JSON.stringify({
                    subject,
                    snippet: message.snippet,
                    labels: message.labelIds,
                }),
            ),
        change,
        subject,
        senderEmail: sender.email,
        senderName: sender.name,
        snippet: cleanGoogleValue(message.snippet, 1_000),
        occurredAt,
        threadId: cleanGoogleValue(message.threadId, 500),
        isRead: message.labelIds ? !message.labelIds.includes('UNREAD') : null,
        webLink: `https://mail.google.com/mail/u/0/#inbox/${message.id}`,
    };
}

function deletedSignal(id: string): EmailSignal {
    return {
        kind: 'email',
        provider: 'gmail',
        objectId: id,
        providerVersion: `deleted:${id}`,
        change: 'deleted',
        subject: null,
        senderEmail: null,
        senderName: null,
        snippet: null,
        occurredAt: new Date().toISOString(),
        threadId: null,
        isRead: null,
        webLink: null,
    };
}

async function fetchGmailMessages(
    ids: Map<string, EmailSignal['change']>,
    token: string,
) {
    const signals: EmailSignal[] = [];
    const entries = [...ids.entries()];
    for (let offset = 0; offset < entries.length; offset += 10) {
        const fetched = await Promise.all(
            entries.slice(offset, offset + 10).map(async ([id, change]) => {
                if (change === 'deleted') return deletedSignal(id);
                const url = `${GMAIL_API}/messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`;
                try {
                    return normalizeMessage(
                        await googleJson<GmailMessage>(url, token),
                        change,
                    );
                } catch (error) {
                    if (
                        error instanceof GoogleHttpError &&
                        error.status === 404
                    )
                        return null;
                    throw error;
                }
            }),
        );
        signals.push(...fetched.filter((item) => item !== null));
    }
    return signals;
}

async function initialGmailSync(token: string, limit: number) {
    const list = await googleJson<{ messages?: Array<{ id?: string }> }>(
        `${GMAIL_API}/messages?labelIds=INBOX&maxResults=${limit}`,
        token,
    );
    const ids = new Map<string, EmailSignal['change']>();
    for (const message of list.messages ?? []) {
        if (message.id) ids.set(message.id, 'received');
    }
    const profile = await googleJson<{ historyId?: string }>(
        `${GMAIL_API}/profile`,
        token,
    );
    return {
        signals: await fetchGmailMessages(ids, token),
        cursor: profile.historyId,
    };
}

function historyChanges(history: GmailHistory) {
    const ids = new Map<string, EmailSignal['change']>();
    for (const record of history.history ?? []) {
        for (const item of record.messagesAdded ?? [])
            if (item.message?.id) ids.set(item.message.id, 'received');
        for (const item of [
            ...(record.labelsAdded ?? []),
            ...(record.labelsRemoved ?? []),
        ])
            if (item.message?.id && ids.get(item.message.id) !== 'received')
                ids.set(item.message.id, 'updated');
        for (const item of record.messagesDeleted ?? [])
            if (item.message?.id) ids.set(item.message.id, 'deleted');
    }
    return ids;
}

async function incrementalGmailSync(
    token: string,
    cursor: string,
    limit: number,
) {
    const params = new URLSearchParams({
        startHistoryId: cursor,
        maxResults: String(limit),
        labelId: 'INBOX',
    });
    for (const type of [
        'messageAdded',
        'messageDeleted',
        'labelAdded',
        'labelRemoved',
    ])
        params.append('historyTypes', type);
    try {
        const history = await fetchHistoryPages(token, params, cursor);
        return {
            signals: await fetchGmailMessages(history.ids, token),
            cursor: history.cursor,
        };
    } catch (error) {
        if (error instanceof GoogleHttpError && error.status === 404)
            return initialGmailSync(token, limit);
        throw error;
    }
}

export function fetchGmailSignals(
    token: string,
    cursor: string | undefined,
    limit: number,
) {
    return cursor
        ? incrementalGmailSync(token, cursor, limit)
        : initialGmailSync(token, limit);
}
