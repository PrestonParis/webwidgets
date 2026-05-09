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

export async function processQueueItem(
    item: QueueItem,
    opts: PipelineOptions,
): Promise<void> {
    // Fetch full message from Gmail
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

    const sender = headers['From'] ?? 'Unknown';
    const subject = headers['Subject'] ?? 'No Subject';

    // Classify via model router (rules → ML → Claude)
    const categoryMap = await routeInference([{ idx: 0, sender, subject }], {
        allowHosted: opts.useAI,
        ...(opts.apiKey ? { apiKey: opts.apiKey } : {}),
    });
    const category = categoryMap.get(0) ?? 'other';

    await opts.supabase
        .from('email_classifications')
        .upsert(
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

    // Extract actions (only if AI enabled and not already processed)
    if (opts.useAI) {
        const { data: already } = await opts.supabase
            .from('email_processing_log')
            .select('email_id')
            .eq('user_id', opts.userId)
            .eq('email_id', item.message_id)
            .maybeSingle();

        if (!already) {
            const snippet = body.slice(0, 500);
            const extractInput: ExtractInput[] = [
                { id: item.message_id, sender, subject, snippet },
            ];
            const actionsMap = await extractEmailActions(extractInput, {
                ...(opts.apiKey ? { apiKey: opts.apiKey } : {}),
            });

            await opts.supabase
                .from('email_processing_log')
                .upsert([{ user_id: opts.userId, email_id: item.message_id }], {
                    onConflict: 'user_id,email_id',
                });

            const rows: Array<{
                user_id: string;
                email_id: string;
                type: string;
                title: string;
                description: string | null;
                due_date: string | null;
                action_url: string | null;
            }> = [];
            for (const [emailId, actions] of actionsMap) {
                for (const action of actions) {
                    rows.push({
                        user_id: opts.userId,
                        email_id: emailId,
                        type: action.type,
                        title: action.title,
                        description: action.description,
                        due_date: action.due_date,
                        action_url: action.action_url,
                    });
                }
            }
            if (rows.length > 0) {
                await opts.supabase
                    .from('email_actions')
                    .upsert(rows, { onConflict: 'user_id,email_id,title' });
            }
        }
    }

    // Store normalized payload and advance stage
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
