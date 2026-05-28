'use client';

import { useCallback, useEffect, useReducer, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    listConversations,
    createConversation,
    listMessages,
    deleteConversation,
    sendMessageStream,
} from '@/features/chatbot/api/chatApi';
import {
    parseSSEStream,
    extractTextDelta,
} from '@/features/chatbot/lib/streamParser';
import {
    DEFAULT_MODEL_ID,
    DEFAULT_PROVIDER,
} from '@/features/chatbot/lib/modelProviders';
import type {
    ChatConversation,
    ChatMessage,
    ModelProvider,
} from '@/features/chatbot/types/chat';

async function collectStream(
    res: Response,
    provider: ModelProvider,
    onDelta: (text: string) => void,
): Promise<string> {
    if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        try {
            const parsed = JSON.parse(text) as { error?: string };
            throw new Error(parsed.error ?? 'Stream failed');
        } catch {
            throw new Error(text || 'Stream failed');
        }
    }
    let full = '';
    for await (const chunk of parseSSEStream(res.body)) {
        try {
            const parsed = JSON.parse(chunk) as { error?: string };
            if (parsed.error) throw new Error(parsed.error);
        } catch (error) {
            if (error instanceof Error && error.name !== 'SyntaxError') {
                throw error;
            }
        }
        const delta = extractTextDelta(chunk, provider);
        full += delta;
        onDelta(full);
    }
    return full;
}

interface UseChatReturn {
    conversations: ChatConversation[];
    activeConversation: ChatConversation | null;
    messages: ChatMessage[];
    streamingContent: string;
    isStreaming: boolean;
    loading: boolean;
    error: string | null;
    selectedModel: string;
    selectedProvider: ModelProvider;
    isAuthenticated: boolean;
    setModel: (modelId: string, provider: ModelProvider) => void;
    selectConversation: (id: string) => Promise<void>;
    startNewConversation: () => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    removeConversation: (id: string) => Promise<void>;
}

export function useChat(): UseChatReturn {
    const { userId, status } = useAuth();
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [streamingContent, setStreamingContent] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [loading, setLoading] = useReducer(
        (_: boolean, v: boolean) => v,
        true,
    );
    const [error, setError] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
    const [selectedProvider, setSelectedProvider] =
        useState<ModelProvider>(DEFAULT_PROVIDER);

    const activeConversation =
        conversations.find((c) => c.id === activeId) ?? null;

    useEffect(() => {
        if (status !== 'authenticated' || !userId) {
            setLoading(false);
            return;
        }
        void listConversations()
            .then(setConversations)
            .catch(() => undefined)
            .finally(() => setLoading(false));
    }, [userId, status]);

    const selectConversation = useCallback(async (id: string) => {
        setActiveId(id);
        const msgs = await listMessages(id);
        setMessages(msgs);
    }, []);

    const startNewConversation = useCallback(async () => {
        const conv = await createConversation(selectedModel, selectedProvider);
        setConversations((prev) => [conv, ...prev]);
        setActiveId(conv.id);
        setMessages([]);
    }, [selectedModel, selectedProvider]);

    const setModel = useCallback((modelId: string, provider: ModelProvider) => {
        setSelectedModel(modelId);
        setSelectedProvider(provider);
    }, []);

    const classifyIntent = useCallback(
        async (text: string): Promise<string> => {
            try {
                const res = await fetch('/api/ml/classify-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text }),
                    signal: AbortSignal.timeout(3000),
                });
                if (!res.ok) return 'help';
                const data = (await res.json()) as { intent?: string };
                return data.intent ?? 'help';
            } catch {
                return 'help';
            }
        },
        [],
    );

    const sendMessage = useCallback(
        async (content: string) => {
            if (isStreaming) return;
            if (!userId) {
                setError('Sign in to chat with an AI model.');
                return;
            }
            void classifyIntent(content);
            let convId = activeId;
            if (!convId) {
                const conv = await createConversation(
                    selectedModel,
                    selectedProvider,
                );
                setConversations((prev) => [conv, ...prev]);
                setActiveId(conv.id);
                convId = conv.id;
            }

            const userMsg: ChatMessage = {
                id: crypto.randomUUID(),
                conversationId: convId,
                role: 'user',
                content,
                createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, userMsg]);
            setIsStreaming(true);
            setStreamingContent('');
            setError(null);

            try {
                const res = await sendMessageStream({
                    conversationId: convId,
                    content,
                    model: selectedModel,
                    provider: selectedProvider,
                });
                const full = await collectStream(
                    res,
                    selectedProvider,
                    setStreamingContent,
                );
                const assistantMsg: ChatMessage = {
                    id: crypto.randomUUID(),
                    conversationId: convId,
                    role: 'assistant',
                    content: full,
                    model: selectedModel,
                    createdAt: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMsg]);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to send message',
                );
            } finally {
                setIsStreaming(false);
                setStreamingContent('');
            }
        },
        [
            userId,
            isStreaming,
            activeId,
            selectedModel,
            selectedProvider,
            classifyIntent,
        ],
    );

    const removeConversation = useCallback(
        async (id: string) => {
            await deleteConversation(id);
            setConversations((prev) => prev.filter((c) => c.id !== id));
            if (activeId === id) {
                setActiveId(null);
                setMessages([]);
            }
        },
        [activeId],
    );

    return {
        conversations,
        activeConversation,
        messages,
        streamingContent,
        isStreaming,
        loading,
        error,
        selectedModel,
        selectedProvider,
        isAuthenticated: status === 'authenticated',
        setModel,
        selectConversation,
        startNewConversation,
        sendMessage,
        removeConversation,
    };
}
