'use client';

import Header from '@/features/ui/components/Header';
import { useChat } from '@/features/chatbot/hooks/useChat';
import { useModelKeys } from '@/features/chatbot/hooks/useModelKeys';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ModelSelector } from './ModelSelector';
import { ConversationList } from './ConversationList';

export default function ChatPage() {
    const chat = useChat();
    const { savedProviders } = useModelKeys();

    return (
        <>
            <Header />
            <div className="flex h-[calc(100vh-56px)]">
                <ConversationList
                    conversations={chat.conversations}
                    activeId={chat.activeConversation?.id ?? null}
                    onSelect={(id) => void chat.selectConversation(id)}
                    onNew={() => void chat.startNewConversation()}
                    onDelete={(id) => void chat.removeConversation(id)}
                />

                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                        <h1 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            {chat.activeConversation?.title ?? 'AI Chat'}
                        </h1>
                        <ModelSelector
                            selectedModel={chat.selectedModel}
                            onSelect={chat.setModel}
                            savedProviders={savedProviders}
                        />
                    </div>

                    {chat.error && (
                        <div className="px-4 py-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30">
                            {chat.error}
                        </div>
                    )}

                    <MessageList
                        messages={chat.messages}
                        streamingContent={chat.streamingContent}
                        isStreaming={chat.isStreaming}
                    />

                    <MessageInput
                        onSend={(content) => void chat.sendMessage(content)}
                        disabled={chat.isStreaming}
                    />
                </div>
            </div>
        </>
    );
}
