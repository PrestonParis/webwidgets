import type { EmailSnapshot } from './supabase.js';

const GRAPH_BASE =
    'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages';

interface GraphMessageBody {
    contentType: 'text' | 'html';
    content: string;
}

interface GraphMessage {
    id: string;
    subject: string;
    bodyPreview: string;
    receivedDateTime: string;
    from?: { emailAddress?: { address?: string; name?: string } };
    body?: GraphMessageBody;
}

interface GraphResponse {
    value?: GraphMessage[];
    error?: { code: string; message: string };
}

// Strip HTML tags to produce storable plain text.
function stripHtml(html: string): string {
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

export async function fetchOutlookSnapshots(
    userId: string,
    accountEmail: string,
    accessToken: string,
    batchSize: number,
): Promise<EmailSnapshot[]> {
    // Include body alongside metadata — avoids a second API round-trip per
    // message and lets us store body_text immediately in email_snapshots.
    const select = 'id,subject,from,receivedDateTime,bodyPreview,body';
    const url =
        `${GRAPH_BASE}?$select=${select}` +
        `&$top=${batchSize}&$orderby=receivedDateTime+desc`;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            // Request plain-text body to minimise stripping work.
            Prefer: 'outlook.body-content-type="text"',
        },
    });
    if (!res.ok) throw new Error(`Outlook fetch failed: ${res.status}`);

    const json = (await res.json()) as GraphResponse;
    if (json.error) throw new Error(`Outlook error: ${json.error.message}`);

    return (json.value ?? []).map((msg): EmailSnapshot => {
        let bodyText: string | undefined;
        if (msg.body?.content) {
            bodyText =
                msg.body.contentType === 'html'
                    ? stripHtml(msg.body.content).slice(0, 20_000)
                    : msg.body.content.slice(0, 20_000);
        }

        return {
            id: `outlook:${msg.id}`,
            user_id: userId,
            account_email: accountEmail,
            provider: 'outlook',
            subject: msg.subject ?? '(no subject)',
            sender_email: msg.from?.emailAddress?.address ?? '',
            sender_name: msg.from?.emailAddress?.name ?? '',
            snippet: msg.bodyPreview ?? '',
            received_at: msg.receivedDateTime,
            raw_date: msg.receivedDateTime,
            body_text: bodyText,
        };
    });
}
