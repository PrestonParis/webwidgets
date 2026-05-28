export type ModelProvider = 'anthropic' | 'openai' | 'google';

export type MessageRole = 'user' | 'assistant';

export interface ModelOption {
    provider: ModelProvider;
    modelId: string;
    label: string;
    requiresUserKey: boolean;
    description: string;
}

export interface ModelProviderAvailability {
    provider: ModelProvider;
    hasUserKey: boolean;
    hasServerKey: boolean;
    available: boolean;
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    role: MessageRole;
    content: string;
    model?: string;
    createdAt: string;
}

export interface ChatConversation {
    id: string;
    userId: string;
    title: string;
    model: string;
    provider: ModelProvider;
    createdAt: string;
    updatedAt: string;
}

export interface UserModelKey {
    id: string;
    userId: string;
    provider: ModelProvider;
    createdAt: string;
}

export interface MessageRow {
    id: string;
    conversation_id: string;
    user_id: string;
    role: string;
    content: string;
    model?: string | null;
    created_at: string;
}

export interface ConversationRow {
    id: string;
    user_id: string;
    title: string;
    model: string;
    provider: string;
    created_at: string;
    updated_at: string;
}

export function rowToMessage(row: MessageRow): ChatMessage {
    return {
        id: row.id,
        conversationId: row.conversation_id,
        role: row.role as MessageRole,
        content: row.content,
        ...(row.model != null && { model: row.model }),
        createdAt: row.created_at,
    };
}

export function rowToConversation(row: ConversationRow): ChatConversation {
    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        model: row.model,
        provider: row.provider as ModelProvider,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export interface SendMessagePayload {
    conversationId: string;
    content: string;
    model: string;
    provider: ModelProvider;
}

export interface ConversationListProps {
    conversations: ChatConversation[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string) => void;
}

export interface MessageInputProps {
    onSend: (content: string) => void;
    disabled: boolean;
    placeholder?: string;
}

export interface MessageListProps {
    messages: ChatMessage[];
    streamingContent: string;
    isStreaming: boolean;
}

export interface ModelSelectorProps {
    selectedModel: string;
    onSelect: (modelId: string, provider: ModelProvider) => void;
    savedProviders: ModelProvider[];
    availability?: ModelProviderAvailability[];
}
