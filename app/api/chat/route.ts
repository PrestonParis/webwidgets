import { NextResponse } from 'next/server';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import { db } from '@/lib/db/supabase';
import {
    getModelKey,
    addMessage,
    listMessages,
    updateConversationTitle,
} from '@/features/chatbot/services/chatService';
import { listEntries } from '@/features/context/services/contextService';
import { buildContextGraph } from '@/features/context/lib/graphBuilder';
import {
    buildSystemPrompt,
    buildQueryGistLabel,
} from '@/features/context/lib/contextPrompt';
import { upsertEntry } from '@/features/context/services/contextService';
import type { SupabaseClient } from '@supabase/supabase-js';

const bodySchema = z.object({
    conversationId: z.string().uuid(),
    content: z.string().min(1).max(8000),
    model: z.string().min(1),
    provider: z.enum(['anthropic', 'openai', 'google']),
});

const DEFAULT_PERMISSIONS = {
    captureWidgetInteractions: true,
    includeQueryGists: true,
    aiPersonalization: true,
};

async function buildSystemMessage(userId: string): Promise<string> {
    try {
        const entries = await listEntries(
            db as unknown as SupabaseClient,
            userId,
        );
        const graph = buildContextGraph(entries);
        return buildSystemPrompt(graph, DEFAULT_PERMISSIONS);
    } catch {
        return "You are a helpful AI assistant embedded in the user's WebWidgets workspace.";
    }
}

async function streamAnthropic(
    apiKey: string,
    model: string,
    systemMsg: string,
    history: { role: 'user' | 'assistant'; content: string }[],
): Promise<ReadableStream<Uint8Array>> {
    const client = new Anthropic({ apiKey });
    const stream = await client.messages.stream({
        model,
        max_tokens: 4096,
        system: systemMsg,
        messages: history,
    });

    return new ReadableStream({
        async start(controller) {
            const enc = new TextEncoder();
            for await (const event of stream) {
                if (
                    event.type === 'content_block_delta' &&
                    event.delta.type === 'text_delta'
                ) {
                    const chunk = JSON.stringify({
                        delta: { text: event.delta.text },
                    });
                    controller.enqueue(enc.encode(`data: ${chunk}\n\n`));
                }
            }
            controller.enqueue(enc.encode('data: [DONE]\n\n'));
            controller.close();
        },
    });
}

async function streamOpenAI(
    apiKey: string,
    model: string,
    systemMsg: string,
    history: { role: 'user' | 'assistant'; content: string }[],
): Promise<ReadableStream<Uint8Array>> {
    const messages = [{ role: 'system', content: systemMsg }, ...history];
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, stream: true }),
    });
    if (!res.ok || !res.body) throw new Error('OpenAI API error');
    return res.body;
}

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const parsed = bodySchema.safeParse(await req.json());
        if (!parsed.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );

        const { conversationId, content, model, provider } = parsed.data;
        const clientDb = db as unknown as SupabaseClient;

        // Persist user message
        await addMessage(clientDb, userId, conversationId, 'user', content);

        // Auto-title on first message
        const history = await listMessages(clientDb, userId, conversationId);
        if (history.filter((m) => m.role === 'user').length === 1) {
            const title = content.split(' ').slice(0, 6).join(' ');
            await updateConversationTitle(
                clientDb,
                userId,
                conversationId,
                title,
            );
        }

        const systemMsg = await buildSystemMessage(userId);

        // Get API key — fall back to server key for Anthropic
        let apiKey = await getModelKey(clientDb, userId, provider);
        if (!apiKey && provider === 'anthropic') {
            apiKey = process.env.ANTHROPIC_API_KEY ?? '';
        }
        if (!apiKey)
            return NextResponse.json(
                { error: `No API key for ${provider}` },
                { status: 402 },
            );

        const msgs = history.map((m) => ({ role: m.role, content: m.content }));

        const bodyStream =
            provider === 'anthropic'
                ? await streamAnthropic(apiKey, model, systemMsg, msgs)
                : await streamOpenAI(apiKey, model, systemMsg, msgs);

        // Async: save assistant message + query gist after stream (fire-and-forget pattern)
        // We collect it via a transform stream
        const [clientStream, captureStream] = bodyStream.tee();

        void (async () => {
            const reader = captureStream.getReader();
            const dec = new TextDecoder();
            let full = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const text = dec.decode(value);
                const lines = text.split('\n');
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') continue;
                    try {
                        const chunk = JSON.parse(data) as Record<
                            string,
                            unknown
                        >;
                        const delta = chunk['delta'] as
                            | Record<string, unknown>
                            | undefined;
                        if (typeof delta?.['text'] === 'string')
                            full += delta['text'];
                        const choices = chunk['choices'] as
                            | Array<Record<string, unknown>>
                            | undefined;
                        const d2 = choices?.[0]?.['delta'] as
                            | Record<string, unknown>
                            | undefined;
                        if (typeof d2?.['content'] === 'string')
                            full += d2['content'];
                    } catch {
                        /* skip */
                    }
                }
            }
            if (full) {
                await addMessage(
                    clientDb,
                    userId,
                    conversationId,
                    'assistant',
                    full,
                    model,
                );
                await upsertEntry(clientDb, userId, {
                    entityId: `query-${conversationId}-${Date.now()}`,
                    entryType: 'query_gist',
                    label: buildQueryGistLabel(content),
                    data: { responsePreview: full.slice(0, 120), model },
                    linkedTo: [],
                });
            }
        })();

        return new Response(clientStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
