'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/features/ui/components/Header';
import { useChat } from '@/features/chatbot/hooks/useChat';
import { useModelKeys } from '@/features/chatbot/hooks/useModelKeys';
import { useChatContext } from '@/features/chatbot/hooks/useChatContext';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ModelSelector } from './ModelSelector';
import { ConversationList } from './ConversationList';
import { ContextStatusPanel } from './ContextStatusPanel';
import { DEFAULT_MODEL_BY_PROVIDER } from '@/features/chatbot/lib/modelProviders';

export default function ChatPage() {
    const chat = useChat();
    const {
        savedProviders,
        availability,
        loading: modelKeysLoading,
    } = useModelKeys();
    const chatContext = useChatContext();
    const [showContextPanel, setShowContextPanel] = useState(false);

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

    const sendDisabled =
        chat.isStreaming ||
        !chat.isAuthenticated ||
        (providerStatusKnown && !hasAvailableProvider);

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
                    {/* Header bar */}
                    <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
                        <h1 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">
                            {chat.activeConversation?.title ?? 'AI Chat'}
                        </h1>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setShowContextPanel((v) => !v)}
                                className="text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500"
                                title="Toggle context panel"
                            >
                                <ContextStatusPanel
                                    context={chatContext.context}
                                    loading={chatContext.loading}
                                    error={chatContext.errorMessage}
                                    onRefresh={chatContext.refresh}
                                    compact
                                />
                            </button>
                            <ModelSelector
                                selectedModel={chat.selectedModel}
                                onSelect={chat.setModel}
                                savedProviders={savedProviders}
                                availability={availability}
                            />
                        </div>
                    </div>

                    {/* Status banners */}
                    {chat.error && (
                        <div className="px-4 py-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30 shrink-0">
                            {chat.error}
                        </div>
                    )}
                    {!chat.isAuthenticated && (
                        <div className="px-4 py-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30 shrink-0">
                            Sign in to use AI Chat.
                        </div>
                    )}
                    {chat.isAuthenticated &&
                        providerStatusKnown &&
                        !hasAvailableProvider && (
                            <div className="px-4 py-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30 shrink-0">
                                No model provider configured.{' '}
                                <Link
                                    href="/settings"
                                    className="font-semibold underline"
                                >
                                    Add an API key in Settings
                                </Link>
                                .
                            </div>
                        )}
                    {chat.isAuthenticated &&
                        !chatContext.loading &&
                        chatContext.error === 'CONTEXT_FETCH_FAILED' && (
                            <div className="px-4 py-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/30 shrink-0">
                                Context service unreachable. Messages will be
                                sent without context.
                            </div>
                        )}
                    {chat.isAuthenticated &&
                        !chatContext.loading &&
                        chatContext.context?.availableSources === 0 &&
                        !chatContext.error && (
                            <div className="px-4 py-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30 shrink-0">
                                No context sources available. Visit the{' '}
                                <Link
                                    href="/context"
                                    className="font-semibold underline"
                                >
                                    Context page
                                </Link>{' '}
                                to build your context graph.
                            </div>
                        )}

                    {/* Main area */}
                    <div className="flex flex-1 min-h-0">
                        <div className="flex flex-col flex-1 min-w-0">
                            <MessageList
                                messages={chat.messages}
                                streamingContent={chat.streamingContent}
                                isStreaming={chat.isStreaming}
                            />
                            <MessageInput
                                onSend={(content) =>
                                    void chat.sendMessage(
                                        content,
                                        chatContext.context,
                                    )
                                }
                                disabled={sendDisabled}
                                placeholder={
                                    !chat.isAuthenticated
                                        ? 'Sign in to chat…'
                                        : providerStatusKnown &&
                                            !hasAvailableProvider
                                          ? 'No model provider. Add an API key in Settings.'
                                          : chatContext.loading
                                            ? 'Loading context…'
                                            : 'Message…'
                                }
                            />
                        </div>

                        {/* Expandable context panel */}
                        {showContextPanel && (
                            <div className="w-72 shrink-0 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto p-3 bg-zinc-50 dark:bg-zinc-950">
                                <ContextStatusPanel
                                    context={chatContext.context}
                                    loading={chatContext.loading}
                                    error={chatContext.errorMessage}
                                    onRefresh={chatContext.refresh}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
