import type {
    ChatConversation,
    ChatMessage,
    ModelProvider,
    SendMessagePayload,
} from '@/features/chatbot/types/chat';

export async function listConversations(): Promise<ChatConversation[]> {
    const res = await fetch('/api/chat/conversations');
    if (!res.ok) throw new Error('Failed to fetch conversations');
    const json = (await res.json()) as { conversations: ChatConversation[] };
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
}

export async function deleteModelKey(provider: ModelProvider): Promise<void> {
    const res = await fetch(`/api/chat/model-keys/${provider}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete model key');
}

export async function listSavedProviders(): Promise<ModelProvider[]> {
    const res = await fetch('/api/chat/model-keys');
    if (!res.ok) throw new Error('Failed to list model keys');
    const json = (await res.json()) as { providers: ModelProvider[] };
    return json.providers;
}
