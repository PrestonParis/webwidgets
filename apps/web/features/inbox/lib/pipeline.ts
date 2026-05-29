import { createHash } from 'crypto';
import { gmail_v1, google } from 'googleapis';
import type { SupabaseClient } from '@supabase/supabase-js';
import he from 'he';
import type { QueueItem } from './queueManager';
import type { NormalizedEmailEvent } from '@/features/inbox/types/events';
import { routeInference } from './modelRouter';
import { extractEmailActions } from './extractActions';
import type { EmailInput as ExtractInput } from './extractActions';

type GmailClient = ReturnType<typeof google.gmail>;
type ActionRow = {
    user_id: string;
    email_id: string;
    type: string;
    title: string;
    description: string | null;
    due_date: string | null;
    action_url: string | null;
};

export interface PipelineOptions {
    gmail: GmailClient;
    supabase: SupabaseClient;
    userId: string;
    useAI: boolean;
    apiKey?: string;
}

function headersToRecord(
    headers: gmail_v1.Schema$MessagePartHeader[],
): Record<string, string> {
    const out: Record<string, string> = {};
    for (const h of headers) {
        if (h.name && h.value) out[h.name] = h.value;
    }
    return out;
}

function extractBody(
    payload: gmail_v1.Schema$MessagePart | null | undefined,
): string {
    if (!payload) return '';
    if (payload.body?.data) {
        return Buffer.from(payload.body.data, 'base64url').toString('utf-8');
    }
    for (const part of payload.parts ?? []) {
        const text = extractBody(part);
        if (text) return text;
    }
    return '';
}

async function fetchNormalizedEvent(
    item: QueueItem,
    opts: PipelineOptions,
): Promise<{
    event: NormalizedEmailEvent;
    sender: string;
    subject: string;
    body: string;
}> {
    const { data: msg } = await opts.gmail.users.messages.get({
        userId: 'me',
        id: item.message_id,
        format: 'full',
    });

    const headers = headersToRecord(msg.payload?.headers ?? []);
    const rawBody = extractBody(msg.payload);
    const body = he.decode(rawBody || msg.snippet || '');
    const attachments = (msg.payload?.parts ?? [])
        .filter((p) => p.filename && p.filename.length > 0)
        .map((p) => ({
            filename: p.filename ?? '',
            mimeType: p.mimeType ?? '',
            size: p.body?.size ?? 0,
        }));

    const event: NormalizedEmailEvent = {
        provider: 'gmail',
        account_id: opts.userId,
        thread_id: msg.threadId ?? '',
        message_id: item.message_id,
        history_id: item.history_id ?? '',
        timestamp: headers['Date'] ?? new Date().toISOString(),
        headers,
        body,
        attachments,
        dedupe_hash: createHash('sha256')
            .update(`gmail:${item.message_id}`)
            .digest('hex'),
    };

    return {
        event,
        sender: headers['From'] ?? 'Unknown',
        subject: headers['Subject'] ?? 'No Subject',
        body,
    };
}

async function upsertClassification(
    item: QueueItem,
    opts: PipelineOptions,
    sender: string,
    subject: string,
): Promise<void> {
    const categoryMap = await routeInference([{ idx: 0, sender, subject }], {
        allowHosted: opts.useAI,
        ...(opts.apiKey ? { apiKey: opts.apiKey } : {}),
    });
    const category = categoryMap.get(0) ?? 'other';

    await opts.supabase.from('email_classifications').upsert(
        [
            {
                user_id: opts.userId,
                email_id: item.message_id,
                sender,
                subject,
                category,
                is_manual: false,
            },
        ],
        { onConflict: 'user_id,email_id', ignoreDuplicates: true },
    );
}

async function hasProcessingLog(item: QueueItem, opts: PipelineOptions) {
    const { data: already } = await opts.supabase
        .from('email_processing_log')
        .select('email_id')
        .eq('user_id', opts.userId)
        .eq('email_id', item.message_id)
        .maybeSingle();
    return Boolean(already);
}

function buildActionRows(
    actionsMap: Awaited<ReturnType<typeof extractEmailActions>>,
    userId: string,
): ActionRow[] {
    const rows: ActionRow[] = [];
    for (const [emailId, actions] of actionsMap) {
        for (const action of actions) {
            rows.push({
                user_id: userId,
                email_id: emailId,
                type: action.type,
                title: action.title,
                description: action.description,
                due_date: action.due_date,
                action_url: action.action_url,
            });
        }
    }
    return rows;
}

async function extractAndStoreActions(
    item: QueueItem,
    opts: PipelineOptions,
    body: string,
    sender: string,
    subject: string,
): Promise<void> {
    if (!opts.useAI || (await hasProcessingLog(item, opts))) return;

    const extractInput: ExtractInput[] = [
        { id: item.message_id, sender, subject, snippet: body.slice(0, 500) },
    ];
    const actionsMap = await extractEmailActions(extractInput, {
        ...(opts.apiKey ? { apiKey: opts.apiKey } : {}),
    });

    await opts.supabase
        .from('email_processing_log')
        .upsert([{ user_id: opts.userId, email_id: item.message_id }], {
            onConflict: 'user_id,email_id',
        });

    const rows = buildActionRows(actionsMap, opts.userId);
    if (rows.length > 0) {
        await opts.supabase
            .from('email_actions')
            .upsert(rows, { onConflict: 'user_id,email_id,title' });
    }
}

async function advanceQueue(
    item: QueueItem,
    opts: PipelineOptions,
    event: NormalizedEmailEvent,
): Promise<void> {
    await opts.supabase
        .from('email_queue')
        .update({
            payload: JSON.parse(JSON.stringify(event)) as Record<
                string,
                unknown
            >,
            stage: 'notify',
            updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);
}

export async function processQueueItem(
    item: QueueItem,
    opts: PipelineOptions,
): Promise<void> {
    const { event, sender, subject, body } = await fetchNormalizedEvent(
        item,
        opts,
    );
    await upsertClassification(item, opts, sender, subject);
    await extractAndStoreActions(item, opts, body, sender, subject);
    await advanceQueue(item, opts, event);
}
