import type {
    ChatConversation,
    ChatMessage,
    ModelProviderAvailability,
    ModelProvider,
    SendMessagePayload,
} from '@/features/chatbot/types/chat';
import { cachedJson, clearCachedJson } from '@/lib/api/requestCache';

export async function listConversations(): Promise<ChatConversation[]> {
    const json = await cachedJson<{ conversations: ChatConversation[] }>(
        '/api/chat/conversations',
        { ttlMs: 8_000 },
    );
    return json.conversations;
}

export async function createConversation(
    model: string,
    provider: ModelProvider,
): Promise<ChatConversation> {
    const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, provider }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    clearCachedJson('/api/chat/conversations');
    const json = (await res.json()) as { conversation: ChatConversation };
    return json.conversation;
}

export async function listMessages(
    conversationId: string,
): Promise<ChatMessage[]> {
    const res = await fetch(`/api/chat/conversations/${conversationId}`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    const json = (await res.json()) as { messages: ChatMessage[] };
    return json.messages;
}

export async function deleteConversation(id: string): Promise<void> {
    const res = await fetch(`/api/chat/conversations/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
    clearCachedJson('/api/chat/conversations');
}

export function sendMessageStream(
    payload: SendMessagePayload,
): Promise<Response> {
    return fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export async function saveModelKey(
    provider: ModelProvider,
    apiKey: string,
): Promise<void> {
    const res = await fetch('/api/chat/model-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
    });
    if (!res.ok) throw new Error('Failed to save model key');
    clearCachedJson('/api/chat/model-keys');
}

export async function deleteModelKey(provider: ModelProvider): Promise<void> {
    const res = await fetch(`/api/chat/model-keys/${provider}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete model key');
    clearCachedJson('/api/chat/model-keys');
}

export async function listModelProviderAvailability(): Promise<{
    providers: ModelProvider[];
    availability: ModelProviderAvailability[];
}> {
    return cachedJson<{
        providers: ModelProvider[];
        availability?: ModelProviderAvailability[];
    }>('/api/chat/model-keys', { ttlMs: 15_000 }).then((json) => ({
        providers: json.providers,
        availability:
            json.availability ??
            json.providers.map((provider) => ({
                provider,
                hasUserKey: true,
                hasServerKey: false,
                available: true,
            })),
    }));
}

export async function listSavedProviders(): Promise<ModelProvider[]> {
    const json = await listModelProviderAvailability();
    return json.providers;
}
