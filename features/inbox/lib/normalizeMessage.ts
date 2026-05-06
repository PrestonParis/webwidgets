import { gmail_v1 } from 'googleapis';
import { GmailMessage } from '@/features/inbox/types/inbox';

function hasHeaderValue(
    h: gmail_v1.Schema$MessagePartHeader | undefined,
): h is { name: string; value: string } {
    return Boolean(h?.name && h?.value);
}

export function normalizeMessage(res: {
    data: gmail_v1.Schema$Message;
}): GmailMessage {
    const msg = res.data;
    return {
        id: msg.id ?? '',
        ...(msg.snippet != null ? { snippet: msg.snippet } : {}),
        payload: {
            headers: (msg.payload?.headers ?? [])
                .filter(hasHeaderValue)
                .map((h) => ({ name: h.name, value: h.value })),
        },
    };
}
