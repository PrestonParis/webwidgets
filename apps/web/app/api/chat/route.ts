import { NextResponse } from 'next/server';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    getModelKey,
    addMessage,
    listMessages,
    updateConversationTitle,
} from '@/features/chatbot/services/chatService';
import { buildQueryGistLabel } from '@/features/context/lib/contextPrompt';
import { buildContextBundleForChat } from '@/features/context/services/contextBundleService';
import {
    ingestContextEdge,
    ingestContextNode,
} from '@/features/context/services/contextService';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ModelProvider } from '@/features/chatbot/types/chat';
import { DEFAULT_MODEL_BY_PROVIDER } from '@/features/chatbot/lib/modelProviders';

const bodySchema = z.object({
    conversationId: z.string().uuid(),
    content: z.string().min(1).max(8000),
    model: z.string().min(1),
    provider: z.enum(['anthropic', 'openai', 'google']),
});

async function* readStreamChunks(
    stream: ReadableStream<Uint8Array>,
): AsyncGenerator<Uint8Array> {
    const reader = stream.getReader();
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) return;
            if (value) yield value;
        }
    } finally {
        reader.releaseLock();
    }
}

async function buildSystemMessage(
    userId: string,
    clientDb: SupabaseClient,
    query: string,
): Promise<string> {
    try {
        const bundle = await buildContextBundleForChat(clientDb, userId, {
            query,
            maxNodes: 30,
            maxPromptChars: 6000,
        });
        return bundle.promptSection;
    } catch {
        return "You are a helpful AI assistant embedded in the user's WebWidgets workspace.";
    }
}

async function* generateAnthropic(
    apiKey: string,
    model: string,
    systemMsg: string,
    history: { role: 'user' | 'assistant'; content: string }[],
): AsyncGenerator<string> {
    const client = new Anthropic({ apiKey });
    const stream = client.messages.stream({
        model,
        max_tokens: 4096,
        system: systemMsg,
        messages: history,
    });

    for await (const event of stream) {
        if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
        ) {
            yield event.delta.text;
        }
    }
}

async function* generateOpenAI(
    apiKey: string,
    model: string,
    systemMsg: string,
    history: { role: 'user' | 'assistant'; content: string }[],
): AsyncGenerator<string> {
    const messages = [{ role: 'system', content: systemMsg }, ...history];
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, stream: true }),
    });
    if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => '');
        throw new Error(
            `OpenAI API error${detail ? `: ${detail.slice(0, 240)}` : ''}`,
        );
    }

    const decoder = new TextDecoder();
    let buffer = '';
    for await (const chunk of readStreamChunks(res.body)) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') return;
            const parsed = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: string } }>;
            };
            const text = parsed.choices?.[0]?.delta?.content ?? '';
            if (text) yield text;
        }
    }
}

async function* generateGoogle(
    apiKey: string,
    model: string,
    systemMsg: string,
    history: { role: 'user' | 'assistant'; content: string }[],
): AsyncGenerator<string> {
    const contents = history.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
    }));
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
    )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemMsg }] },
            contents,
            generationConfig: { maxOutputTokens: 4096 },
        }),
    });
    if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => '');
        throw new Error(
            `Gemini API error${detail ? `: ${detail.slice(0, 240)}` : ''}`,
        );
    }

    const decoder = new TextDecoder();
    let buffer = '';
    for await (const chunk of readStreamChunks(res.body)) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') return;
            const parsed = JSON.parse(data) as {
                candidates?: Array<{
                    content?: { parts?: Array<{ text?: string }> };
                }>;
            };
            const text =
                parsed.candidates?.[0]?.content?.parts
                    ?.map((part) => part.text ?? '')
                    .join('') ?? '';
            if (text) yield text;
        }
    }
}

function getProviderEnvKey(provider: ModelProvider): string {
    if (provider === 'anthropic') return process.env.ANTHROPIC_API_KEY ?? '';
    if (provider === 'openai') return process.env.OPENAI_API_KEY ?? '';
    return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? '';
}

async function getProviderApiKey(
    clientDb: SupabaseClient,
    userId: string,
    provider: ModelProvider,
): Promise<string> {
    return (
        (await getModelKey(clientDb, userId, provider)) ||
        getProviderEnvKey(provider)
    );
}

type ChatAttempt = {
    provider: ModelProvider;
    model: string;
    apiKey: string;
};

async function buildFallbackAttempts(
    clientDb: SupabaseClient,
    userId: string,
    preferredProvider: ModelProvider,
    preferredModel: string,
): Promise<ChatAttempt[]> {
    const providers: ModelProvider[] = [
        preferredProvider,
        ...(['anthropic', 'openai', 'google'] as ModelProvider[]).filter(
            (provider) => provider !== preferredProvider,
        ),
    ];
    const attempts: ChatAttempt[] = [];
    for (const provider of providers) {
        const apiKey = await getProviderApiKey(clientDb, userId, provider);
        if (!apiKey) continue;
        attempts.push({
            provider,
            model:
                provider === preferredProvider
                    ? preferredModel
                    : DEFAULT_MODEL_BY_PROVIDER[provider],
            apiKey,
        });
    }
    return attempts;
}

function generateWithProvider(
    attempt: ChatAttempt,
    systemMsg: string,
    history: { role: 'user' | 'assistant'; content: string }[],
): AsyncGenerator<string> {
    if (attempt.provider === 'anthropic') {
        return generateAnthropic(
            attempt.apiKey,
            attempt.model,
            systemMsg,
            history,
        );
    }
    if (attempt.provider === 'google') {
        return generateGoogle(
            attempt.apiKey,
            attempt.model,
            systemMsg,
            history,
        );
    }
    return generateOpenAI(attempt.apiKey, attempt.model, systemMsg, history);
}

function createFallbackChatStream({
    attempts,
    systemMsg,
    history,
    onComplete,
}: {
    attempts: ChatAttempt[];
    systemMsg: string;
    history: { role: 'user' | 'assistant'; content: string }[];
    onComplete: (result: {
        text: string;
        model: string;
        provider: ModelProvider;
    }) => Promise<void>;
}): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream({
        async start(controller) {
            const failures: string[] = [];
            for (const attempt of attempts) {
                let full = '';
                try {
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({
                                meta: {
                                    provider: attempt.provider,
                                    model: attempt.model,
                                },
                            })}\n\n`,
                        ),
                    );
                    for await (const text of generateWithProvider(
                        attempt,
                        systemMsg,
                        history,
                    )) {
                        full += text;
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({ delta: { text } })}\n\n`,
                            ),
                        );
                    }
                    if (!full.trim()) {
                        throw new Error('Provider returned an empty stream');
                    }
                    await onComplete({
                        text: full,
                        model: attempt.model,
                        provider: attempt.provider,
                    });
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                    return;
                } catch (error) {
                    failures.push(
                        `${attempt.provider}/${attempt.model}: ${
                            error instanceof Error
                                ? error.message
                                : 'unknown error'
                        }`,
                    );
                    if (full) {
                        break;
                    }
                }
            }

            controller.enqueue(
                encoder.encode(
                    `data: ${JSON.stringify({
                        error:
                            failures.length > 0
                                ? `All configured model providers failed. ${failures.join(' | ')}`
                                : 'No configured model provider is available.',
                    })}\n\n`,
                ),
            );
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
        },
    });
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
        const clientDb = supabase;

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

        const systemMsg = await buildSystemMessage(userId, clientDb, content);

        const attempts = await buildFallbackAttempts(
            clientDb,
            userId,
            provider,
            model,
        );
        if (!attempts.length)
            return NextResponse.json(
                { error: 'No API key for any configured chat provider' },
                { status: 402 },
            );

        const msgs = history.map((m) => ({ role: m.role, content: m.content }));
        const clientStream = createFallbackChatStream({
            attempts,
            systemMsg,
            history: msgs,
            async onComplete(result) {
                await addMessage(
                    clientDb,
                    userId,
                    conversationId,
                    'assistant',
                    result.text,
                    result.model,
                );
                const gistEntityId = `chat_gist:${conversationId}:${Date.now()}`;
                await ingestContextNode(clientDb, userId, {
                    entityId: gistEntityId,
                    type: 'chat_gist',
                    label: buildQueryGistLabel(content),
                    summary: result.text.slice(0, 240),
                    data: {
                        conversationId,
                        userMessagePreview: content.slice(0, 240),
                        responsePreview: result.text.slice(0, 120),
                        model: result.model,
                        provider: result.provider,
                    },
                    tags: ['chat'],
                    sourceType: 'chat',
                    sourceId: conversationId,
                    sourceTable: 'chat_messages',
                    createdByType: 'agent',
                    permissions: ['private', 'ai'],
                });
                await ingestContextEdge(clientDb, userId, {
                    fromEntityId: `chat:${conversationId}`,
                    toEntityId: gistEntityId,
                    kind: 'summarizes',
                    label: 'conversation gist',
                    sourceType: 'chat',
                    sourceId: conversationId,
                    createdByType: 'agent',
                });
            },
        });

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
