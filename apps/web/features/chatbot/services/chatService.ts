import type { SupabaseClient } from '@supabase/supabase-js';
import type {
    ChatMessage,
    ChatConversation,
    MessageRow,
    ConversationRow,
    ModelProvider,
} from '@/features/chatbot/types/chat';
import { rowToMessage, rowToConversation } from '@/features/chatbot/types/chat';

export async function createConversation(
    db: SupabaseClient,
    userId: string,
    model: string,
    provider: ModelProvider,
    title = 'New conversation',
): Promise<ChatConversation> {
    const result = await db
        .from('chat_conversations')
        .insert({ user_id: userId, title, model, provider })
        .select()
        .single();
    if (result.error) throw new Error(result.error.message);
    return rowToConversation(result.data as unknown as ConversationRow);
}

export async function listConversations(
    db: SupabaseClient,
    userId: string,
): Promise<ChatConversation[]> {
    const { data, error } = await db
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(50);
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as ConversationRow[]).map(
        rowToConversation,
    );
}

export async function deleteConversation(
    db: SupabaseClient,
    userId: string,
    id: string,
): Promise<void> {
    const { error } = await db
        .from('chat_conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    if (error) throw new Error(error.message);
}

export async function listMessages(
    db: SupabaseClient,
    userId: string,
    conversationId: string,
): Promise<ChatMessage[]> {
    const { data, error } = await db
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as MessageRow[]).map(rowToMessage);
}

export async function addMessage(
    db: SupabaseClient,
    userId: string,
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    model?: string,
): Promise<ChatMessage> {
    const record = {
        user_id: userId,
        conversation_id: conversationId,
        role,
        content,
        ...(model !== undefined && { model }),
    };
    const result = await db
        .from('chat_messages')
        .insert(record)
        .select()
        .single();
    if (result.error) throw new Error(result.error.message);
    return rowToMessage(result.data as unknown as MessageRow);
}

export async function updateConversationTitle(
    db: SupabaseClient,
    userId: string,
    id: string,
    title: string,
): Promise<void> {
    const { error } = await db
        .from('chat_conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);
    if (error) throw new Error(error.message);
}

export async function saveModelKey(
    db: SupabaseClient,
    userId: string,
    provider: ModelProvider,
    apiKey: string,
): Promise<void> {
    const { error } = await db.from('user_model_keys').upsert(
        {
            user_id: userId,
            provider,
            api_key_encrypted: apiKey,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' },
    );
    if (error) throw new Error(error.message);
}

export async function getModelKey(
    db: SupabaseClient,
    userId: string,
    provider: ModelProvider,
): Promise<string | null> {
    const { data } = await db
        .from('user_model_keys')
        .select('api_key_encrypted')
        .eq('user_id', userId)
        .eq('provider', provider)
        .maybeSingle();
    if (!data) return null;
    const row = data as unknown as { api_key_encrypted: string };
    return row.api_key_encrypted;
}

export async function deleteModelKey(
    db: SupabaseClient,
    userId: string,
    provider: ModelProvider,
): Promise<void> {
    const { error } = await db
        .from('user_model_keys')
        .delete()
        .eq('user_id', userId)
        .eq('provider', provider);
    if (error) throw new Error(error.message);
}

export async function listSavedProviders(
    db: SupabaseClient,
    userId: string,
): Promise<ModelProvider[]> {
    const { data } = await db
        .from('user_model_keys')
        .select('provider')
        .eq('user_id', userId);
    return ((data ?? []) as unknown as { provider: string }[]).map(
        (r) => r.provider as ModelProvider,
    );
}
