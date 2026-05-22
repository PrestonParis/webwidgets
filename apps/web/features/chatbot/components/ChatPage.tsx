'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Header from '@/features/ui/components/Header';
import { useChat } from '@/features/chatbot/hooks/useChat';
import { useModelKeys } from '@/features/chatbot/hooks/useModelKeys';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ModelSelector } from './ModelSelector';
import { ConversationList } from './ConversationList';
import { DEFAULT_MODEL_BY_PROVIDER } from '@/features/chatbot/lib/modelProviders';

export default function ChatPage() {
    const chat = useChat();
    const {
        savedProviders,
        availability,
        loading: modelKeysLoading,
    } = useModelKeys();
    const { selectedProvider, setModel } = chat;
    const availableProviders = availability.filter((item) => item.available);
    const hasAvailableProvider = availableProviders.length > 0;
    const selectedProviderAvailable = availability.some(
        (item) => item.provider === selectedProvider && item.available,
    );
    const providerStatusKnown = !modelKeysLoading && availability.length > 0;
    const nextAvailableProvider = availableProviders[0]?.provider ?? null;

    useEffect(() => {
        if (!providerStatusKnown || selectedProviderAvailable) return;
        if (!nextAvailableProvider) return;
        setModel(
            DEFAULT_MODEL_BY_PROVIDER[nextAvailableProvider],
            nextAvailableProvider,
        );
    }, [
        nextAvailableProvider,
        providerStatusKnown,
        selectedProviderAvailable,
        setModel,
    ]);

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
                            availability={availability}
                        />
                    </div>

                    {chat.error && (
                        <div className="px-4 py-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30">
                            {chat.error}
                        </div>
                    )}
                    {!chat.isAuthenticated && (
                        <div className="px-4 py-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30">
                            Sign in to chat with an AI model.
                        </div>
                    )}
                    {chat.isAuthenticated &&
                        providerStatusKnown &&
                        !hasAvailableProvider && (
                            <div className="px-4 py-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30">
                                No chat model provider is configured. Add an API
                                key in{' '}
                                <Link
                                    href="/settings"
                                    className="font-semibold underline"
                                >
                                    Settings
                                </Link>
                                .
                            </div>
                        )}

                    <MessageList
                        messages={chat.messages}
                        streamingContent={chat.streamingContent}
                        isStreaming={chat.isStreaming}
                    />

                    <MessageInput
                        onSend={(content) => void chat.sendMessage(content)}
                        disabled={
                            chat.isStreaming ||
                            !chat.isAuthenticated ||
                            (providerStatusKnown && !hasAvailableProvider)
                        }
                    />
                </div>
            </div>
        </>
    );
}
