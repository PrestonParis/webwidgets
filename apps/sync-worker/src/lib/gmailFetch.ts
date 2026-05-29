import type { EmailSnapshot } from './supabase.js';

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

interface GmailListResponse {
    messages?: { id: string }[];
    error?: { message: string };
}

interface GmailMessage {
    id: string;
    payload?: {
        headers?: { name: string; value: string }[];
    };
    snippet?: string;
    internalDate?: string;
}

function parseFrom(raw: string): { email: string; name: string } {
    const match = raw.match(/^(.*?)\s*<([^>]+)>$/);
    if (match)
        return {
            name: (match[1] ?? '').trim().replace(/^"|"$/g, ''),
            email: match[2] ?? '',
        };
    return { email: raw.trim(), name: '' };
}

function header(msg: GmailMessage, name: string): string {
    return (
        msg.payload?.headers?.find(
            (h) => h.name.toLowerCase() === name.toLowerCase(),
        )?.value ?? ''
    );
}

export async function fetchGmailSnapshots(
    userId: string,
    accountEmail: string,
    accessToken: string,
    batchSize: number,
): Promise<EmailSnapshot[]> {
    // List inbox message IDs
    const listUrl = `${GMAIL_BASE}/messages?maxResults=${batchSize}&labelIds=INBOX&q=in:inbox`;
    const listRes = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!listRes.ok) throw new Error(`Gmail list failed: ${listRes.status}`);
    const list = (await listRes.json()) as GmailListResponse;
    if (list.error) throw new Error(`Gmail list error: ${list.error.message}`);
    const ids = (list.messages ?? []).map((m) => m.id);
    if (ids.length === 0) return [];

    // Fetch metadata for each message in parallel (bounded concurrency)
    const CONCURRENCY = 10;
    const snapshots: EmailSnapshot[] = [];
    for (let i = 0; i < ids.length; i += CONCURRENCY) {
        const chunk = ids.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(
            chunk.map(async (id) => {
                const url = `${GMAIL_BASE}/messages/${id}?format=metadata&metadataHeaders=Subject,From,Date`;
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (!res.ok) return null;
                return (await res.json()) as GmailMessage;
            }),
        );
        for (const r of results) {
            if (r.status !== 'fulfilled' || !r.value) continue;
            const msg = r.value;
            const subject = header(msg, 'Subject') || '(no subject)';
            const fromRaw = header(msg, 'From');
            const dateStr = header(msg, 'Date');
            const { email: senderEmail, name: senderName } = parseFrom(fromRaw);
            const internalMs = msg.internalDate
                ? parseInt(msg.internalDate, 10)
                : Date.now();
            const receivedAt = new Date(internalMs).toISOString();

            snapshots.push({
                id: `gmail:${msg.id}`,
                user_id: userId,
                account_email: accountEmail,
                provider: 'gmail',
                subject,
                sender_email: senderEmail,
                sender_name: senderName,
                snippet: msg.snippet ?? '',
                received_at: receivedAt,
                raw_date: dateStr,
            });
        }
    }
    return snapshots;
}
