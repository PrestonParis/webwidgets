import type { EmailSnapshot } from './supabase.js';

const GRAPH_BASE =
    'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages';

interface GraphMessage {
    id: string;
    subject: string;
    bodyPreview: string;
    receivedDateTime: string;
    from?: { emailAddress?: { address?: string; name?: string } };
}

interface GraphResponse {
    value?: GraphMessage[];
    error?: { code: string; message: string };
}

export async function fetchOutlookSnapshots(
    userId: string,
    accountEmail: string,
    accessToken: string,
    batchSize: number,
): Promise<EmailSnapshot[]> {
    const url =
        `${GRAPH_BASE}?$select=id,subject,from,receivedDateTime,bodyPreview` +
        `&$top=${batchSize}&$orderby=receivedDateTime+desc`;

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Outlook fetch failed: ${res.status}`);

    const json = (await res.json()) as GraphResponse;
    if (json.error) throw new Error(`Outlook error: ${json.error.message}`);

    return (json.value ?? []).map(
        (msg): EmailSnapshot => ({
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
        }),
    );
}
