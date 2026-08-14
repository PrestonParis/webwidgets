-- chat_conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New conversation',
    model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    provider TEXT NOT NULL DEFAULT 'anthropic',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chat_conversations_user ON chat_conversations(user_id, created_at DESC);
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own conversations" ON chat_conversations FOR ALL USING (auth.uid() = user_id);
-- chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chat_messages_conv ON chat_messages(conversation_id, created_at ASC);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON chat_messages FOR ALL USING (auth.uid() = user_id);
-- user_model_keys (user-provided API keys for AI providers)
CREATE TABLE IF NOT EXISTS user_model_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, provider)
);
ALTER TABLE user_model_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own model keys" ON user_model_keys FOR ALL USING (auth.uid() = user_id);
-- context_entries (knowledge graph representing the user's workspace context)
CREATE TABLE IF NOT EXISTS context_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('profile', 'goal', 'widget', 'integration', 'query_gist', 'insight')),
    entity_id TEXT NOT NULL,
    label TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    linked_to TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, entity_id)
);
CREATE INDEX idx_context_entries_user ON context_entries(user_id, entry_type);
ALTER TABLE context_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own context entries" ON context_entries FOR ALL USING (auth.uid() = user_id);
